import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { toZonedTime } from 'date-fns-tz';

function convertDatesToTimezone(data: any, tz: string): any {
  if (data instanceof Date) {
    return toZonedTime(data, tz);
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = convertDatesToTimezone(data[i], tz);
    }
    return data;
  }

  if (data !== null && typeof data === 'object') {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = convertDatesToTimezone(data[key], tz);
      }
    }
    return data;
  }

  return data;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Define it in your environment (e.g., .env, docker-compose, or deployment config).',
      );
    }
    super({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });

    return this.createExtendedClient() as any;
  }

  private createExtendedClient() {
    const tz = this.config.get('TZ', 'Asia/Ho_Chi_Minh');

    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const result = await query(args);
            return convertDatesToTimezone(result, tz);
          },
        },
      },
    });

    // Map lifecycle hooks to the extended client so NestJS calls them
    (extended as any).onModuleInit = async () => {
      await this.connectWithRetry();
    };

    (extended as any).onModuleDestroy = async () => {
      await this.onModuleDestroy();
    };

    return extended;
  }

  // This is called by the extended client's onModuleInit hook (mapped above)
  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 10, delayMs = 2000): Promise<void> {
    const url = this.config.get<string>('DATABASE_URL');
    if (url) {
      const maskedUrl = url.replace(/:([^:@]+)@/, ':***@');
      console.log(`🔌 Connecting to Database: ${maskedUrl}`);
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}