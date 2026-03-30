import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigurationModule } from '@common/configuration/infrastructure/configuration.module';
import { DatabaseModule } from '@common/database/infrastructure/database.module';
import { ExceptionModule } from '@common/exception/infrastructure';
import { ThrottlerModule } from '@common/throttler/infrastructure/throttler.module';
import { RequestIdMiddleware } from '@common/helpers/infrastructure';
import { AuthModule } from '@modules/auth/infrastructure';
import { InvitationsModule } from '@modules/invitations/infrastructure';
import { GroupsModule } from '@modules/groups/infrastructure';
import { FoldersModule } from '@modules/folders/infrastructure';
import { DocumentsModule } from '@modules/documents/infrastructure';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { HistoryModule } from '@modules/history/infrastructure';
import { McpCommonModule } from '@common/mcp/infrastructure';
import { ApiKeysModule } from '@modules/api-keys/infrastructure';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    ExceptionModule,
    ThrottlerModule,
    McpCommonModule,
    AuthModule,
    InvitationsModule,
    GroupsModule,
    FoldersModule,
    DocumentsModule,
    PermissionsModule,
    HistoryModule,
    ApiKeysModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
