import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './persistence/document.entity';
import { DocumentOrmRepository } from './persistence/document-orm.repository';
import { CreateDocumentController } from './api/create-document.controller';
import { GetDocumentController } from './api/get-document.controller';
import { UpdateDocumentController } from './api/update-document.controller';
import { DeleteDocumentController } from './api/delete-document.controller';
import { ListDocumentsByFolderController } from './api/list-documents-by-folder.controller';
import { MoveDocumentController } from './api/move-document.controller';
import { DocumentProvidersEnum, DocumentRepositoryInterface } from '../domain';
import {
  CreateDocumentUseCase,
  GetDocumentByIdUseCase,
  UpdateDocumentUseCase,
  DeleteDocumentUseCase,
  ListDocumentsByFolderUseCase,
  MoveDocumentUseCase,
} from '../application';
import { FolderProvidersEnum, FolderRepositoryInterface } from '@modules/folders/domain';
import { FoldersModule } from '@modules/folders/infrastructure';
import { PermissionsModule } from '@modules/permissions/infrastructure';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    FoldersModule,
    PermissionsModule,
  ],
  controllers: [
    CreateDocumentController,
    GetDocumentController,
    UpdateDocumentController,
    DeleteDocumentController,
    ListDocumentsByFolderController,
    MoveDocumentController,
  ],
  providers: [
    {
      inject: [getRepositoryToken(DocumentEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.DOCUMENT_REPOSITORY,
      useFactory: (repo: Repository<DocumentEntity>, ex: ExceptionServiceInterface) =>
        new DocumentOrmRepository(repo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
      useFactory: (docRepo: DocumentRepositoryInterface, folderRepo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new CreateDocumentUseCase(docRepo, folderRepo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface, ex: ExceptionServiceInterface) =>
        new GetDocumentByIdUseCase(repo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.UPDATE_DOCUMENT_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface, ex: ExceptionServiceInterface) =>
        new UpdateDocumentUseCase(repo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.DELETE_DOCUMENT_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface, ex: ExceptionServiceInterface) =>
        new DeleteDocumentUseCase(repo, ex),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY],
      provide: DocumentProvidersEnum.LIST_DOCUMENTS_BY_FOLDER_USE_CASE,
      useFactory: (repo: DocumentRepositoryInterface) =>
        new ListDocumentsByFolderUseCase(repo),
    },
    {
      inject: [DocumentProvidersEnum.DOCUMENT_REPOSITORY, FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: DocumentProvidersEnum.MOVE_DOCUMENT_USE_CASE,
      useFactory: (docRepo: DocumentRepositoryInterface, folderRepo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new MoveDocumentUseCase(docRepo, folderRepo, ex),
    },
  ],
  exports: [DocumentProvidersEnum.DOCUMENT_REPOSITORY],
})
export class DocumentsModule {}
