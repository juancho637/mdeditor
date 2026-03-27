import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentSnapshotEntity } from '@modules/documents/infrastructure/persistence/document-snapshot.entity';
import { DocumentsModule } from '@modules/documents/infrastructure';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { DocumentProvidersEnum, DocumentRepositoryInterface } from '@modules/documents/domain';
import { PermissionProvidersEnum } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';
import { HistoryProvidersEnum, HistoryRepositoryInterface } from '../domain';
import { HistoryOrmRepository } from './persistence/history-orm.repository';
import { ListDocumentSnapshotsUseCase, GetSnapshotDetailUseCase } from '../application';
import { ListDocumentSnapshotsController } from './api/list-document-snapshots.controller';
import { GetSnapshotDetailController } from './api/get-snapshot-detail.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentSnapshotEntity]),
    DocumentsModule,
    PermissionsModule,
  ],
  controllers: [
    ListDocumentSnapshotsController,
    GetSnapshotDetailController,
  ],
  providers: [
    {
      inject: [getRepositoryToken(DocumentSnapshotEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: HistoryProvidersEnum.HISTORY_REPOSITORY,
      useFactory: (repo: Repository<DocumentSnapshotEntity>, ex: ExceptionServiceInterface) =>
        new HistoryOrmRepository(repo, ex),
    },
    {
      inject: [
        HistoryProvidersEnum.HISTORY_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: HistoryProvidersEnum.LIST_DOCUMENT_SNAPSHOTS_USE_CASE,
      useFactory: (
        historyRepo: HistoryRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        checkPermission: CheckPermissionUseCase,
        ex: ExceptionServiceInterface,
      ) => new ListDocumentSnapshotsUseCase(historyRepo, docRepo, checkPermission, ex),
    },
    {
      inject: [
        HistoryProvidersEnum.HISTORY_REPOSITORY,
        DocumentProvidersEnum.DOCUMENT_REPOSITORY,
        PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: HistoryProvidersEnum.GET_SNAPSHOT_DETAIL_USE_CASE,
      useFactory: (
        historyRepo: HistoryRepositoryInterface,
        docRepo: DocumentRepositoryInterface,
        checkPermission: CheckPermissionUseCase,
        ex: ExceptionServiceInterface,
      ) => new GetSnapshotDetailUseCase(historyRepo, docRepo, checkPermission, ex),
    },
  ],
})
export class HistoryModule {}
