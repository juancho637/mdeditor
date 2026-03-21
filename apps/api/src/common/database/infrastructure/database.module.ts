import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          join(__dirname, '..', '..', '..', 'modules', '**', '*.entity.{ts,js}'),
        ],
        migrations: [
          join(__dirname, '..', 'migrations', '*.{ts,js}'),
        ],
        synchronize: false,
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
