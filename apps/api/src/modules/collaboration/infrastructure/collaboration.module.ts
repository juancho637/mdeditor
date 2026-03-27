import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthModule } from '@modules/auth/infrastructure';
import { DocumentUpdateEntity } from '@modules/documents/infrastructure/persistence/document-update.entity';
import { DocumentSnapshotEntity } from '@modules/documents/infrastructure/persistence/document-snapshot.entity';
import { DocumentsModule } from '@modules/documents/infrastructure';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { DocumentRepositoryInterface, DocumentProvidersEnum } from '@modules/documents/domain';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';
import {
  CollaborationProvidersEnum,
  DocumentUpdateRepositoryInterface,
  DocumentSnapshotRepositoryInterface,
} from '../domain';
import { LoadDocumentUseCase, ApplyUpdateUseCase, PersistSnapshotUseCase } from '../application';
import { InMemoryDocumentSyncService } from './services/in-memory-document-sync.service';
import { DocumentUpdateOrmRepository } from './persistence/document-update-orm.repository';
import { DocumentSnapshotOrmRepository } from './persistence/document-snapshot-orm.repository';
import { CollaborationGateway } from './gateway/collaboration.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentUpdateEntity, DocumentSnapshotEntity]),
    DocumentsModule,
    PermissionsModule,
    AuthModule,
  ],
  providers: [
    // Repositories
    {
      inject: [getRepositoryToken(DocumentUpdateEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: CollaborationProvidersEnum.DOCUMENT_UPDATE_REPOSITORY,
      useFactory: (repo: Repository<DocumentUpdateEntity>, ex: ExceptionServiceInterface) =>
        new DocumentUpdateOrmRepository(repo, ex),
    },
    {
      inject: [getRepositoryToken(DocumentSnapshotEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: CollaborationProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY,
      useFactory: (repo: Repository<DocumentSnapshotEntity>, ex: ExceptionServiceInterface) =>
        new DocumentSnapshotOrmRepository(repo, ex),
    },
    // Use Cases
    {
      inject: [
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        CollaborationProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY,
        CollaborationProvidersEnum.DOCUMENT_UPDATE_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: CollaborationProvidersEnum.LOAD_DOCUMENT_USE_CASE,
      useFactory: (
        docRepo: DocumentRepositoryInterface,
        snapRepo: DocumentSnapshotRepositoryInterface,
        updateRepo: DocumentUpdateRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new LoadDocumentUseCase(docRepo, snapRepo, updateRepo, ex),
    },
    {
      inject: [CollaborationProvidersEnum.DOCUMENT_UPDATE_REPOSITORY],
      provide: CollaborationProvidersEnum.APPLY_UPDATE_USE_CASE,
      useFactory: (updateRepo: DocumentUpdateRepositoryInterface) =>
        new ApplyUpdateUseCase(updateRepo),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, CollaborationProvidersEnum.DOCUMENT_SNAPSHOT_REPOSITORY, CollaborationProvidersEnum.DOCUMENT_UPDATE_REPOSITORY],
      provide: CollaborationProvidersEnum.PERSIST_SNAPSHOT_USE_CASE,
      useFactory: (docRepo: DocumentRepositoryInterface, snapRepo: DocumentSnapshotRepositoryInterface, updateRepo: DocumentUpdateRepositoryInterface) =>
        new PersistSnapshotUseCase(docRepo, snapRepo, updateRepo),
    },
    // Sync Service
    {
      inject: [
        CollaborationProvidersEnum.LOAD_DOCUMENT_USE_CASE,
        CollaborationProvidersEnum.APPLY_UPDATE_USE_CASE,
        CollaborationProvidersEnum.PERSIST_SNAPSHOT_USE_CASE,
      ],
      provide: CollaborationProvidersEnum.DOCUMENT_SYNC_SERVICE,
      useFactory: (
        loadDoc: LoadDocumentUseCase,
        applyUpdate: ApplyUpdateUseCase,
        persistSnapshot: PersistSnapshotUseCase,
      ) => new InMemoryDocumentSyncService(loadDoc, applyUpdate, persistSnapshot),
    },
    // Gateway
    CollaborationGateway,
  ],
  exports: [CollaborationProvidersEnum.DOCUMENT_SYNC_SERVICE],
})
export class CollaborationModule {}
