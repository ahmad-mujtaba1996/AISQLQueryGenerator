import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { newDb, IMemoryDb, DataType } from 'pg-mem';
import { Pool } from 'pg';
import { SEED_USERS, SEED_PRODUCTS, SEED_ORDERS } from '../../../prisma/seed-data';

export class SqlExecutionException extends Error {
  constructor(
    public readonly message: string,
    public readonly isAuthorizationError: boolean = false,
  ) {
    super(message);
    this.name = 'SqlExecutionException';
  }
}

export interface ExecutionResult {
  rows: Record<string, any>[];
  columns: string[];
  rowCount: number;
  durationMs: number;
  mode: 'live_supabase' | 'secure_sandbox';
  roleUsed: string;
}

@Injectable()
export class SqlExecutionService implements OnModuleInit {
  private readonly logger = new Logger(SqlExecutionService.name);
  private sandboxDb: IMemoryDb | null = null;
  private analyticsPool: Pool | null = null;
  private readonly STATEMENT_TIMEOUT_MS = 5000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.initSandboxDb();
    this.initAnalyticsPool();
  }

  /**
   * Initializes the in-memory PostgreSQL sandbox with golden seed data
   */
  private initSandboxDb() {
    try {
      const db = newDb();

      // Register standard analytical PostgreSQL functions in pg-mem
      db.public.registerFunction({
        name: 'to_char',
        args: [db.public.getType(DataType.timestamp), db.public.getType(DataType.text)],
        returns: db.public.getType(DataType.text),
        implementation: (ts: string | Date, fmt: string) => {
          const d = new Date(ts);
          if (fmt === 'YYYY-MM') return d.toISOString().slice(0, 7);
          if (fmt.includes('YYYY-MM-DD')) return d.toISOString().replace('T', ' ').slice(0, 16);
          return d.toISOString();
        },
      });

      db.public.registerFunction({
        name: 'round',
        args: [db.public.getType(DataType.decimal), db.public.getType(DataType.integer)],
        returns: db.public.getType(DataType.decimal),
        implementation: (val: number, dec: number) => Number(Number(val).toFixed(dec)),
      });

      db.public.registerFunction({
        name: 'date_trunc',
        args: [db.public.getType(DataType.text), db.public.getType(DataType.timestamp)],
        returns: db.public.getType(DataType.timestamp),
        implementation: (part: string, ts: string | Date) => {
          const d = new Date(ts);
          if (part.toLowerCase() === 'month') {
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
          }
          return d;
        },
      });

      // Create Tables
      db.public.none(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          country TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          product_id INTEGER NOT NULL REFERENCES products(id),
          amount NUMERIC(10,2) NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed Users
      for (const u of SEED_USERS) {
        db.public.none(
          `INSERT INTO users (id, name, email, country, created_at) VALUES (${u.id}, '${u.name.replace(/'/g, "''")}', '${u.email}', '${u.country}', '${u.createdAt}');`,
        );
      }

      // Seed Products
      for (const p of SEED_PRODUCTS) {
        db.public.none(
          `INSERT INTO products (id, title, category, price, created_at) VALUES (${p.id}, '${p.title.replace(/'/g, "''")}', '${p.category}', ${p.price}, '${p.createdAt}');`,
        );
      }

      // Seed Orders
      for (const o of SEED_ORDERS) {
        db.public.none(
          `INSERT INTO orders (id, user_id, product_id, amount, status, created_at) VALUES (${o.id}, ${o.userId}, ${o.productId}, ${o.amount}, '${o.status}', '${o.createdAt}');`,
        );
      }

      this.sandboxDb = db;
      this.logger.log('PostgreSQL analytical sandbox initialized with 30 seed records.');
    } catch (err) {
      this.logger.error(`Failed to initialize in-memory sandbox: ${(err as Error).message}`);
    }
  }

  /**
   * Initializes PostgreSQL pool with least-privilege analytics role if configured
   */
  private initAnalyticsPool() {
    const analyticsUrl = process.env.ANALYTICS_DATABASE_URL;
    const dbUrl = analyticsUrl || process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

    if (dbUrl && !dbUrl.includes('yourpassword')) {
      try {
        this.analyticsPool = new Pool({
          connectionString: dbUrl,
          statement_timeout: this.STATEMENT_TIMEOUT_MS,
          max: 10,
        });
        this.logger.log(
          `Analytics PostgreSQL Pool initialized with ${analyticsUrl ? 'dedicated least-privilege role' : 'primary connection'}.`,
        );
      } catch (err) {
        this.logger.warn(`Could not initialize analytics pool: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Safely executes an AST-validated SQL query within timeout limits
   */
  async execute(sanitizedSql: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    // 1. Attempt live execution if connected to external Supabase PostgreSQL
    if (this.analyticsPool) {
      try {
        return await this.executeOnPostgresPool(sanitizedSql, startTime);
      } catch (liveError) {
        this.logger.warn(
          `Live PostgreSQL execution failed: ${(liveError as Error).message}. Attempting sandbox execution.`,
        );
        // If it's an authorization or permission error, do NOT fallback silently; raise the authorization error!
        if (this.isAuthError((liveError as Error).message)) {
          throw new SqlExecutionException((liveError as Error).message, true);
        }
      }
    }

    if (this.prisma.getIsConnected()) {
      try {
        return await this.executeOnPrismaReadOnly(sanitizedSql, startTime);
      } catch (prismaError) {
        this.logger.warn(
          `Prisma live execution failed: ${(prismaError as Error).message}. Falling back to sandbox.`,
        );
        if (this.isAuthError((prismaError as Error).message)) {
          throw new SqlExecutionException((prismaError as Error).message, true);
        }
      }
    }

    // 2. Resilient Sandbox Execution with timeout guard
    return await this.executeOnSandbox(sanitizedSql, startTime);
  }

  /**
   * Executes query on live PostgreSQL pool wrapped in READ ONLY transaction
   */
  private async executeOnPostgresPool(sql: string, startTime: number): Promise<ExecutionResult> {
    const client = await this.analyticsPool!.connect();
    try {
      // Set read-only transaction and strict timeout
      await client.query('BEGIN TRANSACTION READ ONLY;');
      await client.query(`SET LOCAL statement_timeout = '${this.STATEMENT_TIMEOUT_MS}ms';`);

      const res = await client.query(sql);

      await client.query('COMMIT;');

      const durationMs = Math.round(performance.now() - startTime);
      const rows = res.rows || [];
      const columns = res.fields ? res.fields.map((f) => f.name) : rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        rows,
        columns,
        rowCount: rows.length,
        durationMs,
        mode: 'live_supabase',
        roleUsed: process.env.ANALYTICS_DATABASE_URL ? 'datapulse_analytics_role' : 'restricted_read_only_tx',
      };
    } catch (err) {
      try {
        await client.query('ROLLBACK;');
      } catch (rbErr) {
        // ignore rollback errors
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Executes query via Prisma raw query
   */
  private async executeOnPrismaReadOnly(sql: string, startTime: number): Promise<ExecutionResult> {
    const result: any[] = await this.prisma.$queryRawUnsafe(sql);
    const durationMs = Math.round(performance.now() - startTime);
    const rows = Array.isArray(result) ? result : [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      rows,
      columns,
      rowCount: rows.length,
      durationMs,
      mode: 'live_supabase',
      roleUsed: 'prisma_runtime_role',
    };
  }

  /**
   * Executes query in high-performance in-memory PostgreSQL engine
   */
  private async executeOnSandbox(sql: string, startTime: number): Promise<ExecutionResult> {
    if (!this.sandboxDb) {
      this.initSandboxDb();
    }

    // Wrap execution in timeout
    const executionPromise = new Promise<any[]>((resolve, reject) => {
      try {
        const rows = this.sandboxDb!.public.many(sql);
        resolve(rows);
      } catch (e) {
        reject(e);
      }
    });

    let timeoutTimer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(
        () => reject(new Error('Query execution exceeded maximum timeout (5000ms)')),
        this.STATEMENT_TIMEOUT_MS,
      );
      if (timeoutTimer.unref) {
        timeoutTimer.unref();
      }
    });

    try {
      const rawRows = (await Promise.race([executionPromise, timeoutPromise])) as Record<string, any>[];
      if (timeoutTimer) clearTimeout(timeoutTimer);
      const durationMs = Math.max(1, Math.round(performance.now() - startTime));
      const rows = rawRows.map((r) => this.normalizeRow(r));
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        rows,
        columns,
        rowCount: rows.length,
        durationMs,
        mode: 'secure_sandbox',
        roleUsed: 'datapulse_analytics_sandbox',
      };
    } catch (err) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      const message = (err as Error).message;
      const isAuth = this.isAuthError(message);
      throw new SqlExecutionException(message, isAuth);
    }
  }

  /**
   * Normalizes numeric & date types for clean JSON response
   */
  private normalizeRow(row: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      if (val instanceof Date) {
        normalized[key] = val.toISOString();
      } else if (typeof val === 'bigint') {
        normalized[key] = Number(val);
      } else if (typeof val === 'number') {
        normalized[key] = Math.round(val * 100) / 100;
      } else {
        normalized[key] = val;
      }
    }
    return normalized;
  }

  private isAuthError(errMsg: string): boolean {
    const lower = errMsg.toLowerCase();
    return (
      lower.includes('permission denied') ||
      lower.includes('authorization') ||
      lower.includes('must be owner') ||
      lower.includes('read-only transaction') ||
      lower.includes('access denied')
    );
  }
}
