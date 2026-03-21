import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { SetupController } from './api/setup.controller';
import { StatusController } from './api/status.controller';
import { HealthController } from './api/health.controller';
import {
  AuthUseCasesEnum,
  AuthServiceInterface,
} from '../domain';
import { SetupUseCase } from '../application';
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

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRATION') as any,
        },
      }),
    }),
  ],
  controllers: [SetupController, StatusController, HealthController],
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
      ) => new SetupUseCase(userRepository, createUserUseCase, authService, exception),
    },
  ],
  exports: [AuthUseCasesEnum.SETUP_USE_CASE, JwtAuthGuard],
})
export class AuthModule {}
