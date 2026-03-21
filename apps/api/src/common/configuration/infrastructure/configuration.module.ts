import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
        API_PORT: Joi.number().default(3000),
        THROTTLE_GLOBAL_TTL: Joi.number().default(60000),
        THROTTLE_GLOBAL_LIMIT: Joi.number().default(100),
        THROTTLE_LOGIN_TTL: Joi.number().default(60000),
        THROTTLE_LOGIN_LIMIT: Joi.number().default(5),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class ConfigurationModule {}
