import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ExceptionProvidersEnum,
  ExceptionServiceInterface,
} from '@common/exception/domain';
import {
  McpCommonProvidersEnum,
  McpServerService,
} from '@common/mcp/infrastructure';
import { McpCommonModule } from '@common/mcp/infrastructure';
import {
  FolderProvidersEnum,
  FolderRepositoryInterface,
} from '@modules/folders/domain';
import { FoldersModule } from '@modules/folders/infrastructure';
import {
  DocumentProvidersEnum,
  DocumentRepositoryInterface,
} from '@modules/documents/domain';
import { DocumentsModule } from '@modules/documents/infrastructure';
import { PermissionProvidersEnum } from '@modules/permissions/domain';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { CheckPermissionUseCase } from '@modules/permissions/application';

import { ApiKeyProvidersEnum, ApiKeyRepositoryInterface } from '../domain';
import { ValidateApiKeyUseCase, CreateApiKeyUseCase } from '../application';
import { ApiKeyEntity } from './persistence/api-key.entity';
import { ApiKeyOrmRepository } from './persistence/api-key-orm.repository';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { CreateApiKeyController } from './api/create-api-key.controller';
import { ListFoldersMcpQuery } from './mcp/query/list-folders.mcp-query';
import { ListDocumentsMcpQuery } from './mcp/query/list-documents.mcp-query';
import { ReadDocumentMcpQuery } from './mcp/query/read-document.mcp-query';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKeyEntity]),
    McpCommonModule,
    FoldersModule,
    DocumentsModule,
    PermissionsModule,
  ],
  controllers: [CreateApiKeyController],
  providers: [
    // Repository
    {
      inject: [
        getRepositoryToken(ApiKeyEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: ApiKeyProvidersEnum.API_KEY_REPOSITORY,
      useFactory: (
        repo: Repository<ApiKeyEntity>,
        ex: ExceptionServiceInterface,
      ) => new ApiKeyOrmRepository(repo, ex),
    },
    // Use cases
    {
      inject: [
        ApiKeyProvidersEnum.API_KEY_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: ApiKeyProvidersEnum.VALIDATE_API_KEY_USE_CASE,
      useFactory: (
        repo: ApiKeyRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new ValidateApiKeyUseCase(repo, ex),
    },
    {
      inject: [ApiKeyProvidersEnum.API_KEY_REPOSITORY],
      provide: ApiKeyProvidersEnum.CREATE_API_KEY_USE_CASE,
      useFactory: (repo: ApiKeyRepositoryInterface) =>
        new CreateApiKeyUseCase(repo),
    },
    // Guard
    ApiKeyAuthGuard,
    // MCP tool registration
    {
      inject: [
        McpCommonProvidersEnum.MCP_SERVER_SERVICE,
        FolderProvidersEnum.FOLDER_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: 'MCP_TOOL_REGISTRATION',
      useFactory: (
        mcpService: McpServerService,
        folderRepo: FolderRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        exception: ExceptionServiceInterface,
      ) => {
        const listFolders = new ListFoldersMcpQuery(folderRepo, checkPerm);
        const listDocuments = new ListDocumentsMcpQuery(
          folderRepo,
          docRepo,
          checkPerm,
          exception,
        );
        const readDocument = new ReadDocumentMcpQuery(
          docRepo,
          checkPerm,
          exception,
        );

        mcpService.registerTools((server, userId) =>
          listFolders.register(server, userId),
        );
        mcpService.registerTools((server, userId) =>
          listDocuments.register(server, userId),
        );
        mcpService.registerTools((server, userId) =>
          readDocument.register(server, userId),
        );

        return true;
      },
    },
  ],
  exports: [ApiKeyProvidersEnum.CREATE_API_KEY_USE_CASE],
})
export class ApiKeysModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ApiKeyAuthMiddleware)
      .exclude('api/mcp/keys')
      .forRoutes(
        { path: 'api/mcp', method: RequestMethod.POST },
        { path: 'api/mcp', method: RequestMethod.GET },
        { path: 'api/mcp', method: RequestMethod.DELETE },
      );
  }
}

// Middleware that applies ApiKeyAuthGuard for MCP protocol routes
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestMethod } from '@nestjs/common';

@Injectable()
class ApiKeyAuthMiddleware implements NestMiddleware {
  constructor(private readonly guard: ApiKeyAuthGuard) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const fakeContext = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    try {
      await this.guard.canActivate(fakeContext);
      next();
    } catch {
      throw new UnauthorizedException({
        code_error: 'AKY001',
        message: 'Invalid or revoked API key.',
      });
    }
  }
}
