import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';
import { FolderProvidersEnum, FolderRepositoryInterface } from '@modules/folders/domain';
import { FoldersModule } from '@modules/folders/infrastructure';
import { DocumentProvidersEnum, DocumentRepositoryInterface } from '@modules/documents/domain';
import { DocumentsModule } from '@modules/documents/infrastructure';
import { PermissionProvidersEnum } from '@modules/permissions/domain';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { CheckPermissionUseCase } from '@modules/permissions/application';

import { McpProvidersEnum, ApiKeyRepositoryInterface } from '../domain';
import {
  ValidateApiKeyUseCase,
  CreateApiKeyUseCase,
  ListFoldersUseCase,
  ListDocumentsUseCase,
  ReadDocumentUseCase,
} from '../application';
import { ApiKeyEntity } from './persistence/api-key.entity';
import { ApiKeyOrmRepository } from './persistence/api-key-orm.repository';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { McpServerService } from './services/mcp-server.service';
import { McpController } from './api/mcp.controller';
import { CreateApiKeyController } from './api/create-api-key.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKeyEntity]),
    FoldersModule,
    DocumentsModule,
    PermissionsModule,
  ],
  controllers: [McpController, CreateApiKeyController],
  providers: [
    {
      inject: [getRepositoryToken(ApiKeyEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: McpProvidersEnum.API_KEY_REPOSITORY,
      useFactory: (repo: Repository<ApiKeyEntity>, ex: ExceptionServiceInterface) =>
        new ApiKeyOrmRepository(repo, ex),
    },
    {
      inject: [McpProvidersEnum.API_KEY_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: McpProvidersEnum.VALIDATE_API_KEY_USE_CASE,
      useFactory: (repo: ApiKeyRepositoryInterface, ex: ExceptionServiceInterface) =>
        new ValidateApiKeyUseCase(repo, ex),
    },
    {
      inject: [McpProvidersEnum.API_KEY_REPOSITORY],
      provide: McpProvidersEnum.CREATE_API_KEY_USE_CASE,
      useFactory: (repo: ApiKeyRepositoryInterface) => new CreateApiKeyUseCase(repo),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY, PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE],
      provide: McpProvidersEnum.LIST_FOLDERS_USE_CASE,
      useFactory: (folderRepo: FolderRepositoryInterface, checkPerm: CheckPermissionUseCase) =>
        new ListFoldersUseCase(folderRepo, checkPerm),
    },
    {
      inject: [
        FolderProvidersEnum.FOLDER_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: McpProvidersEnum.LIST_DOCUMENTS_USE_CASE,
      useFactory: (
        folderRepo: FolderRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        ex: ExceptionServiceInterface,
      ) => new ListDocumentsUseCase(folderRepo, docRepo, checkPerm, ex),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: McpProvidersEnum.READ_DOCUMENT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        ex: ExceptionServiceInterface,
      ) => new ReadDocumentUseCase(docRepo, checkPerm, ex),
    },
    {
      inject: [
        McpProvidersEnum.LIST_FOLDERS_USE_CASE,
        McpProvidersEnum.LIST_DOCUMENTS_USE_CASE,
        McpProvidersEnum.READ_DOCUMENT_USE_CASE,
      ],
      provide: McpProvidersEnum.MCP_SERVER_SERVICE,
      useFactory: (
        listFolders: ListFoldersUseCase,
        listDocuments: ListDocumentsUseCase,
        readDocument: ReadDocumentUseCase,
      ) => {
        const service = new McpServerService(listFolders, listDocuments, readDocument);
        service.onModuleInit();
        return service;
      },
    },
    ApiKeyAuthGuard,
  ],
  exports: [McpProvidersEnum.CREATE_API_KEY_USE_CASE],
})
export class McpModule {}
