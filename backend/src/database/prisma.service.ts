import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    if (!dbUrl) {
      this.logger.warn('DATABASE_URL or SUPABASE_DATABASE_URL not set. Running in resilient sandbox mode.');
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Connected successfully to Supabase PostgreSQL database.');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        `Could not connect to external PostgreSQL database (${(error as Error).message}). Local sandbox engine will be used.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
