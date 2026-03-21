import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigurationModule } from '@common/configuration/infrastructure/configuration.module';
import { DatabaseModule } from '@common/database/infrastructure/database.module';
import { ExceptionModule } from '@common/exception/infrastructure';
import { RequestIdMiddleware } from '@common/helpers/infrastructure';
import { AuthModule } from '@modules/auth/infrastructure';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    ExceptionModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
