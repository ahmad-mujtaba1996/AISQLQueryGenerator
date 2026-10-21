"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SqlExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlExecutionService = exports.SqlExecutionException = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const pg_mem_1 = require("pg-mem");
const pg_1 = require("pg");
const seed_data_1 = require("../../../prisma/seed-data");
class SqlExecutionException extends Error {
    message;
    isAuthorizationError;
    constructor(message, isAuthorizationError = false) {
        super(message);
        this.message = message;
        this.isAuthorizationError = isAuthorizationError;
        this.name = 'SqlExecutionException';
    }
}
exports.SqlExecutionException = SqlExecutionException;
let SqlExecutionService = SqlExecutionService_1 = class SqlExecutionService {
    prisma;
    logger = new common_1.Logger(SqlExecutionService_1.name);
    sandboxDb = null;
    analyticsPool = null;
    STATEMENT_TIMEOUT_MS = 5000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        this.initSandboxDb();
        this.initAnalyticsPool();
    }
    initSandboxDb() {
        try {
            const db = (0, pg_mem_1.newDb)();
            db.public.registerFunction({
                name: 'to_char',
                args: [db.public.getType(pg_mem_1.DataType.timestamp), db.public.getType(pg_mem_1.DataType.text)],
                returns: db.public.getType(pg_mem_1.DataType.text),
                implementation: (ts, fmt) => {
                    const d = new Date(ts);
                    if (fmt === 'YYYY-MM')
                        return d.toISOString().slice(0, 7);
                    if (fmt.includes('YYYY-MM-DD'))
                        return d.toISOString().replace('T', ' ').slice(0, 16);
                    return d.toISOString();
                },
            });
            db.public.registerFunction({
                name: 'round',
                args: [db.public.getType(pg_mem_1.DataType.decimal), db.public.getType(pg_mem_1.DataType.integer)],
                returns: db.public.getType(pg_mem_1.DataType.decimal),
                implementation: (val, dec) => Number(Number(val).toFixed(dec)),
            });
            db.public.registerFunction({
                name: 'date_trunc',
                args: [db.public.getType(pg_mem_1.DataType.text), db.public.getType(pg_mem_1.DataType.timestamp)],
                returns: db.public.getType(pg_mem_1.DataType.timestamp),
                implementation: (part, ts) => {
                    const d = new Date(ts);
                    if (part.toLowerCase() === 'month') {
                        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
                    }
                    return d;
                },
            });
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
            for (const u of seed_data_1.SEED_USERS) {
                db.public.none(`INSERT INTO users (id, name, email, country, created_at) VALUES (${u.id}, '${u.name.replace(/'/g, "''")}', '${u.email}', '${u.country}', '${u.createdAt}');`);
            }
            for (const p of seed_data_1.SEED_PRODUCTS) {
                db.public.none(`INSERT INTO products (id, title, category, price, created_at) VALUES (${p.id}, '${p.title.replace(/'/g, "''")}', '${p.category}', ${p.price}, '${p.createdAt}');`);
            }
            for (const o of seed_data_1.SEED_ORDERS) {
                db.public.none(`INSERT INTO orders (id, user_id, product_id, amount, status, created_at) VALUES (${o.id}, ${o.userId}, ${o.productId}, ${o.amount}, '${o.status}', '${o.createdAt}');`);
            }
            this.sandboxDb = db;
            this.logger.log('PostgreSQL analytical sandbox initialized with 30 seed records.');
        }
        catch (err) {
            this.logger.error(`Failed to initialize in-memory sandbox: ${err.message}`);
        }
    }
    initAnalyticsPool() {
        const analyticsUrl = process.env.ANALYTICS_DATABASE_URL;
        const dbUrl = analyticsUrl || process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
        if (dbUrl && !dbUrl.includes('yourpassword')) {
            try {
                this.analyticsPool = new pg_1.Pool({
                    connectionString: dbUrl,
                    statement_timeout: this.STATEMENT_TIMEOUT_MS,
                    max: 10,
                });
                this.logger.log(`Analytics PostgreSQL Pool initialized with ${analyticsUrl ? 'dedicated least-privilege role' : 'primary connection'}.`);
            }
            catch (err) {
                this.logger.warn(`Could not initialize analytics pool: ${err.message}`);
            }
        }
    }
    async execute(sanitizedSql) {
        const startTime = performance.now();
        if (this.analyticsPool) {
            try {
                return await this.executeOnPostgresPool(sanitizedSql, startTime);
            }
            catch (liveError) {
                this.logger.warn(`Live PostgreSQL execution failed: ${liveError.message}. Attempting sandbox execution.`);
                if (this.isAuthError(liveError.message)) {
                    throw new SqlExecutionException(liveError.message, true);
                }
            }
        }
        if (this.prisma.getIsConnected()) {
            try {
                return await this.executeOnPrismaReadOnly(sanitizedSql, startTime);
            }
            catch (prismaError) {
                this.logger.warn(`Prisma live execution failed: ${prismaError.message}. Falling back to sandbox.`);
                if (this.isAuthError(prismaError.message)) {
                    throw new SqlExecutionException(prismaError.message, true);
                }
            }
        }
        return await this.executeOnSandbox(sanitizedSql, startTime);
    }
    async executeOnPostgresPool(sql, startTime) {
        const client = await this.analyticsPool.connect();
        try {
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
        }
        catch (err) {
            try {
                await client.query('ROLLBACK;');
            }
            catch (rbErr) {
            }
            throw err;
        }
        finally {
            client.release();
        }
    }
    async executeOnPrismaReadOnly(sql, startTime) {
        const result = await this.prisma.$queryRawUnsafe(sql);
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
    async executeOnSandbox(sql, startTime) {
        if (!this.sandboxDb) {
            this.initSandboxDb();
        }
        const executionPromise = new Promise((resolve, reject) => {
            try {
                const rows = this.sandboxDb.public.many(sql);
                resolve(rows);
            }
            catch (e) {
                reject(e);
            }
        });
        let timeoutTimer = null;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutTimer = setTimeout(() => reject(new Error('Query execution exceeded maximum timeout (5000ms)')), this.STATEMENT_TIMEOUT_MS);
            if (timeoutTimer.unref) {
                timeoutTimer.unref();
            }
        });
        try {
            const rawRows = (await Promise.race([executionPromise, timeoutPromise]));
            if (timeoutTimer)
                clearTimeout(timeoutTimer);
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
        }
        catch (err) {
            if (timeoutTimer)
                clearTimeout(timeoutTimer);
            const message = err.message;
            const isAuth = this.isAuthError(message);
            throw new SqlExecutionException(message, isAuth);
        }
    }
    normalizeRow(row) {
        const normalized = {};
        for (const [key, val] of Object.entries(row)) {
            if (val instanceof Date) {
                normalized[key] = val.toISOString();
            }
            else if (typeof val === 'bigint') {
                normalized[key] = Number(val);
            }
            else if (typeof val === 'number') {
                normalized[key] = Math.round(val * 100) / 100;
            }
            else {
                normalized[key] = val;
            }
        }
        return normalized;
    }
    isAuthError(errMsg) {
        const lower = errMsg.toLowerCase();
        return (lower.includes('permission denied') ||
            lower.includes('authorization') ||
            lower.includes('must be owner') ||
            lower.includes('read-only transaction') ||
            lower.includes('access denied'));
    }
};
exports.SqlExecutionService = SqlExecutionService;
exports.SqlExecutionService = SqlExecutionService = SqlExecutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SqlExecutionService);
//# sourceMappingURL=sql-execution.service.js.map