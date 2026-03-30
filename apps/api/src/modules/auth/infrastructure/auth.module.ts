import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { SetupController } from './api/setup.controller';
import { StatusController } from './api/status.controller';
import { HealthController } from './api/health.controller';
import { SignInController } from './api/sign-in.controller';
import { RefreshTokenController } from './api/refresh-token.controller';
import { LogoutController } from './api/logout.controller';
import { TokenRevocationRedisRepository } from './persistence/token-revocation-redis.repository';
import {
  AuthUseCasesEnum,
  AuthServiceInterface,
  TokenRevocationRepositoryInterface,
} from '../domain';
import {
  SetupUseCase,
  SignInUseCase,
  RefreshTokenUseCase,
} from '../application';
import {
  UsersProvidersEnum,
  UserRepositoryInterface,
} from '@modules/users/domain';
import { CreateUserUseCase } from '@modules/users/application';
import { UsersModule } from '@modules/users/infrastructure';
import {
  ExceptionProvidersEnum,
  ExceptionServiceInterface,
} from '@common/exception/domain';
import { RedisProvidersEnum } from '@common/redis/infrastructure/redis-providers.enum';
import { RedisModule } from '@common/redis/infrastructure/redis.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('JWT_EXPIRATION') as never,
        },
      }),
    }),
  ],
  controllers: [
    SetupController,
    StatusController,
    HealthController,
    SignInController,
    RefreshTokenController,
    LogoutController,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    {
      inject: [JwtService, ConfigService],
      provide: AuthUseCasesEnum.AUTH_SERVICE,
      useFactory: (jwtService: JwtService, configService: ConfigService) =>
        new AuthService(jwtService, configService),
    },
    {
      inject: [RedisProvidersEnum.REDIS_CLIENT],
      provide: AuthUseCasesEnum.TOKEN_REVOCATION_REPOSITORY,
      useFactory: (redis: Redis) => new TokenRevocationRedisRepository(redis),
    },
    {
      inject: [
        UsersProvidersEnum.USER_REPOSITORY,
        UsersProvidersEnum.CREATE_USER_USE_CASE,
        AuthUseCasesEnum.AUTH_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: AuthUseCasesEnum.SETUP_USE_CASE,
      useFactory: (
        userRepository: UserRepositoryInterface,
        createUserUseCase: CreateUserUseCase,
        authService: AuthServiceInterface,
        exception: ExceptionServiceInterface,
      ) =>
        new SetupUseCase(
          userRepository,
          createUserUseCase,
          authService,
          exception,
        ),
    },
    {
      inject: [
        UsersProvidersEnum.USER_REPOSITORY,
        AuthUseCasesEnum.AUTH_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: AuthUseCasesEnum.SIGN_IN_USE_CASE,
      useFactory: (
        userRepository: UserRepositoryInterface,
        authService: AuthServiceInterface,
        exception: ExceptionServiceInterface,
      ) => new SignInUseCase(userRepository, authService, exception),
    },
    {
      inject: [
        JwtService,
        UsersProvidersEnum.USER_REPOSITORY,
        AuthUseCasesEnum.AUTH_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
        ConfigService,
        AuthUseCasesEnum.TOKEN_REVOCATION_REPOSITORY,
      ],
      provide: AuthUseCasesEnum.REFRESH_TOKEN_USE_CASE,
      useFactory: (
        jwtService: JwtService,
        userRepository: UserRepositoryInterface,
        authService: AuthServiceInterface,
        exception: ExceptionServiceInterface,
        configService: ConfigService,
        tokenRevocation: TokenRevocationRepositoryInterface,
      ) =>
        new RefreshTokenUseCase(
          jwtService,
          userRepository,
          authService,
          exception,
          configService,
          tokenRevocation,
        ),
    },
  ],
  exports: [
    AuthUseCasesEnum.SETUP_USE_CASE,
    AuthUseCasesEnum.AUTH_SERVICE,
    JwtAuthGuard,
    JwtModule,
  ],
})
export class AuthModule {}
