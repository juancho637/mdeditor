import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisProvidersEnum } from './redis-providers.enum';

@Module({
  providers: [
    {
      provide: RedisProvidersEnum.REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
        });
      },
    },
  ],
  exports: [RedisProvidersEnum.REDIS_CLIENT],
})
export class RedisModule {}
