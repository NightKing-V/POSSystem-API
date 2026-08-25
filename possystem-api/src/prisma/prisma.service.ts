import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    
    const isProduction = process.env.NODE_ENV === 'production';
    super({
      adapter,
      log: isProduction
        ? [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      (this as any).$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
      });
      (this as any).$on('info', (e: any) => {
        this.logger.log(e.message);
      });
    }

    (this as any).$on('warn', (e: any) => {
      this.logger.warn(e.message);
    });
    (this as any).$on('error', (e: any) => {
      this.logger.error(e.message);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
