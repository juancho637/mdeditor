import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([
        {
          name: 'default',
          ttl: configService.get<number>('THROTTLE_GLOBAL_TTL', 60000),
          limit: configService.get<number>('THROTTLE_GLOBAL_LIMIT', 100),
        },
        {
          name: 'login',
          ttl: configService.get<number>('THROTTLE_LOGIN_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LOGIN_LIMIT', 5),
        },
      ]),
    }),
  ],
})
export class ThrottlerModule {}
