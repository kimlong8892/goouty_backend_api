import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

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
  }

  async onModuleInit() {
    // Don't await the connection to prevent blocking app startup.
    // Cloud Run needs the app to listen on the port quickly.
    // We'll log the error if connection fails.
    this.connectWithRetry().catch((err) => {
      console.error('❌ Failed to connect to database during startup (background retry):', err);
    });
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