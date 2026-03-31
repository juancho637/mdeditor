import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ExceptionProvidersEnum,
  ExceptionServiceInterface,
} from '@common/exception/domain';
import {
  FolderProvidersEnum,
  FolderRepositoryInterface,
} from '@modules/folders/domain';
import { FoldersModule } from '@modules/folders/infrastructure';
import { PermissionProvidersEnum } from '@modules/permissions/domain';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { AuthModule } from '@modules/auth/infrastructure';

import {
  DocumentProvidersEnum,
  DocumentRepositoryInterface,
  DocumentShareRepositoryInterface,
  DocumentUpdateRepositoryInterface,
  DocumentSnapshotRepositoryInterface,
  DocumentSyncServiceInterface,
} from '../domain';
import {
  CreateDocumentUseCase,
  CreateDocumentShareUseCase,
  DeleteDocumentShareUseCase,
  GetDocumentByIdUseCase,
  GetDocumentByShareTokenUseCase,
  GetDocumentShareUseCase,
  UpdateDocumentUseCase,
  DeleteDocumentUseCase,
  ListDocumentsByFolderUseCase,
  MoveDocumentUseCase,
  ListAccessibleDocumentsUseCase,
  LoadDocumentUseCase,
  ApplyUpdateUseCase,
  PersistSnapshotUseCase,
  ReadDocumentContentUseCase,
  CreateDocumentWithContentUseCase,
  ReplaceDocumentContentUseCase,
  SearchDocumentsUseCase,
  ImportDocumentsUseCase,
} from '../application';

import { DocumentEntity } from './persistence/document.entity';
import { DocumentShareEntity } from './persistence/document-share.entity';
import { DocumentUpdateEntity } from './persistence/document-update.entity';
import { DocumentSnapshotEntity } from './persistence/document-snapshot.entity';
import { DocumentOrmRepository } from './persistence/document-orm.repository';
import { DocumentShareOrmRepository } from './persistence/document-share-orm.repository';
import { DocumentUpdateOrmRepository } from './persistence/document-update-orm.repository';
import { DocumentSnapshotOrmRepository } from './persistence/document-snapshot-orm.repository';
import { InMemoryDocumentSyncService } from './services/in-memory-document-sync.service';
import { CollaborationGateway } from './gateway/collaboration.gateway';

import { CreateDocumentController } from './api/create-document.controller';
import { CreateDocumentShareController } from './api/create-document-share.controller';
import { DeleteDocumentShareController } from './api/delete-document-share.controller';
import { GetDocumentController } from './api/get-document.controller';
import { GetDocumentShareController } from './api/get-document-share.controller';
import { GetPublicDocumentController } from './api/get-public-document.controller';
import { UpdateDocumentController } from './api/update-document.controller';
import { DeleteDocumentController } from './api/delete-document.controller';
import { ListDocumentsByFolderController } from './api/list-documents-by-folder.controller';
import { MoveDocumentController } from './api/move-document.controller';
import { SearchDocumentsController } from './api/search-documents.controller';
import { ImportDocumentsController } from './api/import-documents.controller';

import { ListAccessibleFoldersUseCase } from '@modules/folders/application';
import { ListFoldersMcpTool } from '@modules/folders/infrastructure/mcp/list-folders.mcp-tool';
import { ListDocumentsMcpTool } from './mcp/list-documents.mcp-tool';
import { ReadDocumentMcpTool } from './mcp/read-document.mcp-tool';
import { CreateDocumentMcpTool } from './mcp/create-document.mcp-tool';
import { EditDocumentMcpTool } from './mcp/edit-document.mcp-tool';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentEntity,
      DocumentShareEntity,
      DocumentUpdateEntity,
      DocumentSnapshotEntity,
    ]),
    FoldersModule,
    PermissionsModule,
    AuthModule,
  ],
  controllers: [
    ImportDocumentsController,
    SearchDocumentsController,
    CreateDocumentController,
    CreateDocumentShareController,
    DeleteDocumentShareController,
    GetDocumentController,
    GetDocumentShareController,
    GetPublicDocumentController,
    UpdateDocumentController,
    DeleteDocumentController,
    ListDocumentsByFolderController,
    MoveDocumentController,
  ],
  providers: [
    // Repositories
    {
      inject: [
        getRepositoryToken(DocumentEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.DOCUMENT_REPOSITORY,
      useFactory: (
        repo: Repository<DocumentEntity>,
        ex: ExceptionServiceInterface,
      ) => new DocumentOrmRepository(repo, ex),
    },
    {
      inject: [
        getRepositoryToken(DocumentShareEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.DOCUMENT_SHARE_REPOSITORY,
      useFactory: (
        repo: Repository<DocumentShareEntity>,
        ex: ExceptionServiceInterface,
      ) => new DocumentShareOrmRepository(repo, ex),
    },
    {
      inject: [
        getRepositoryToken(DocumentUpdateEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.DOCUMENT_UPDATE_REPOSITORY,
      useFactory: (
        repo: Repository<DocumentUpdateEntity>,
        ex: ExceptionServiceInterface,
      ) => new DocumentUpdateOrmRepository(repo, ex),
    },
    {
      inject: [
        getRepositoryToken(DocumentSnapshotEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY,
      useFactory: (
        repo: Repository<DocumentSnapshotEntity>,
        ex: ExceptionServiceInterface,
      ) => new DocumentSnapshotOrmRepository(repo, ex),
    },
    // CRUD Use Cases
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        FolderProvidersEnum.FOLDER_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        folderRepo: FolderRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new CreateDocumentUseCase(docRepo, folderRepo, ex),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE,
      useFactory: (
        repo: DocumentRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new GetDocumentByIdUseCase(repo, ex),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.UPDATE_DOCUMENT_USE_CASE,
      useFactory: (
        repo: DocumentRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new UpdateDocumentUseCase(repo, ex),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.DELETE_DOCUMENT_USE_CASE,
      useFactory: (
        repo: DocumentRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new DeleteDocumentUseCase(repo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY],
      provide: DocumentProvidersEnum.LIST_DOCUMENTS_BY_FOLDER_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface) =>
        new ListDocumentsByFolderUseCase(repo),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        FolderProvidersEnum.FOLDER_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.MOVE_DOCUMENT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        folderRepo: FolderRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new MoveDocumentUseCase(docRepo, folderRepo, ex),
    },
    // Collaboration Use Cases
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_UPDATE_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.LOAD_DOCUMENT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        snapRepo: DocumentSnapshotRepositoryInterface,
        updateRepo: DocumentUpdateRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new LoadDocumentUseCase(docRepo, snapRepo, updateRepo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_UPDATE_REPOSITORY],
      provide: DocumentProvidersEnum.APPLY_UPDATE_USE_CASE,
      useFactory: (updateRepo: DocumentUpdateRepositoryInterface) =>
        new ApplyUpdateUseCase(updateRepo),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_UPDATE_REPOSITORY,
      ],
      provide: DocumentProvidersEnum.PERSIST_SNAPSHOT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        snapRepo: DocumentSnapshotRepositoryInterface,
        updateRepo: DocumentUpdateRepositoryInterface,
      ) => new PersistSnapshotUseCase(docRepo, snapRepo, updateRepo),
    },
    // Search Use Case
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY],
      provide: DocumentProvidersEnum.SEARCH_DOCUMENTS_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface) =>
        new SearchDocumentsUseCase(repo),
    },
    // Import Use Case
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
        DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.IMPORT_DOCUMENTS_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        createDoc: CreateDocumentUseCase,
        syncService: DocumentSyncServiceInterface,
        checkPerm: CheckPermissionUseCase,
        ex: ExceptionServiceInterface,
      ) =>
        new ImportDocumentsUseCase(
          docRepo,
          createDoc,
          syncService,
          checkPerm,
          ex,
        ),
    },
    // Share Use Cases
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_SHARE_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.CREATE_DOCUMENT_SHARE_USE_CASE,
      useFactory: (
        shareRepo: DocumentShareRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new CreateDocumentShareUseCase(shareRepo, docRepo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_SHARE_REPOSITORY],
      provide: DocumentProvidersEnum.GET_DOCUMENT_SHARE_USE_CASE,
      useFactory: (shareRepo: DocumentShareRepositoryInterface) =>
        new GetDocumentShareUseCase(shareRepo),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_SHARE_REPOSITORY],
      provide: DocumentProvidersEnum.DELETE_DOCUMENT_SHARE_USE_CASE,
      useFactory: (shareRepo: DocumentShareRepositoryInterface) =>
        new DeleteDocumentShareUseCase(shareRepo),
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_SHARE_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: DocumentProvidersEnum.GET_DOCUMENT_BY_SHARE_TOKEN_USE_CASE,
      useFactory: (
        shareRepo: DocumentShareRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new GetDocumentByShareTokenUseCase(shareRepo, docRepo, ex),
    },
    // Sync Service
    {
      inject: [
        DocumentProvidersEnum.LOAD_DOCUMENT_USE_CASE,
        DocumentProvidersEnum.APPLY_UPDATE_USE_CASE,
        DocumentProvidersEnum.PERSIST_SNAPSHOT_USE_CASE,
      ],
      provide: DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
      useFactory: (
        loadDoc: LoadDocumentUseCase,
        applyUpdate: ApplyUpdateUseCase,
        persistSnapshot: PersistSnapshotUseCase,
      ) =>
        new InMemoryDocumentSyncService(loadDoc, applyUpdate, persistSnapshot),
    },
    // WebSocket Gateway
    CollaborationGateway,
    // MCP Tools
    {
      inject: [
        FolderProvidersEnum.FOLDER_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
      ],
      provide: 'LIST_FOLDERS_MCP_TOOL',
      useFactory: (
        folderRepo: FolderRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
      ) => {
        const useCase = new ListAccessibleFoldersUseCase(folderRepo, checkPerm);
        return new ListFoldersMcpTool(useCase);
      },
    },
    {
      inject: [
        FolderProvidersEnum.FOLDER_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: 'LIST_DOCUMENTS_MCP_TOOL',
      useFactory: (
        folderRepo: FolderRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        exception: ExceptionServiceInterface,
      ) => {
        const useCase = new ListAccessibleDocumentsUseCase(
          folderRepo,
          docRepo,
          checkPerm,
          exception,
        );
        return new ListDocumentsMcpTool(useCase);
      },
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: 'READ_DOCUMENT_MCP_TOOL',
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        syncService: DocumentSyncServiceInterface,
        exception: ExceptionServiceInterface,
      ) => {
        const useCase = new ReadDocumentContentUseCase(
          docRepo,
          checkPerm,
          syncService,
          exception,
        );
        return new ReadDocumentMcpTool(useCase);
      },
    },
    {
      inject: [
        DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: 'CREATE_DOCUMENT_MCP_TOOL',
      useFactory: (
        createDocUseCase: CreateDocumentUseCase,
        checkPerm: CheckPermissionUseCase,
        syncService: DocumentSyncServiceInterface,
        exception: ExceptionServiceInterface,
      ) => {
        const useCase = new CreateDocumentWithContentUseCase(
          createDocUseCase,
          checkPerm,
          syncService,
          exception,
        );
        return new CreateDocumentMcpTool(useCase);
      },
    },
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: 'EDIT_DOCUMENT_MCP_TOOL',
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        checkPerm: CheckPermissionUseCase,
        syncService: DocumentSyncServiceInterface,
        exception: ExceptionServiceInterface,
      ) => {
        const useCase = new ReplaceDocumentContentUseCase(
          docRepo,
          checkPerm,
          syncService,
          exception,
        );
        return new EditDocumentMcpTool(useCase);
      },
    },
  ],
  exports: [
    DocumentProvidersEnum.DOCUMENT_REPOSITORY,
    DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
    DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
  ],
})
export class DocumentsModule {}
