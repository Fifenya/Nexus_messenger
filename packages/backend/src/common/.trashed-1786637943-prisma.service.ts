import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.logger.log('🔄 Подключение к базе данных...');
    await this.$connect();
    this.logger.log('✅ Подключено к базе данных');
    
    // Логирование запросов в dev режиме
    if (process.env.NODE_ENV === 'development') {
      // Исправляем ошибку с типом
      (this as any).$on('query', (e: any) => {
        this.logger.debug(`📊 Query: ${e.query}`);
        this.logger.debug(`⏱️  Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔄 Отключение от базы данных...');
    await this.$disconnect();
    this.logger.log('✅ Отключено от базы данных');
  }
}
