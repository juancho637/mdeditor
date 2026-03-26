import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './persistence/folder.entity';
import { FolderOrmRepository } from './persistence/folder-orm.repository';
import { CreateFolderController } from './api/create-folder.controller';
import { GetFolderTreeController } from './api/get-folder-tree.controller';
import { GetFolderController } from './api/get-folder.controller';
import { UpdateFolderController } from './api/update-folder.controller';
import { DeleteFolderController } from './api/delete-folder.controller';
import {
  FolderProvidersEnum,
  FolderRepositoryInterface,
} from '../domain';
import {
  CreateFolderUseCase,
  GetFolderTreeUseCase,
  GetFolderByIdUseCase,
  UpdateFolderUseCase,
  DeleteFolderUseCase,
} from '../application';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';

@Module({
  imports: [TypeOrmModule.forFeature([FolderEntity])],
  controllers: [
    CreateFolderController,
    GetFolderTreeController,
    GetFolderController,
    UpdateFolderController,
    DeleteFolderController,
  ],
  providers: [
    {
      inject: [getRepositoryToken(FolderEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: FolderProvidersEnum.FOLDER_REPOSITORY,
      useFactory: (repo: Repository<FolderEntity>, ex: ExceptionServiceInterface) =>
        new FolderOrmRepository(repo, ex),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: FolderProvidersEnum.CREATE_FOLDER_USE_CASE,
      useFactory: (repo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new CreateFolderUseCase(repo, ex),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY],
      provide: FolderProvidersEnum.GET_FOLDER_TREE_USE_CASE,
      useFactory: (repo: FolderRepositoryInterface) => new GetFolderTreeUseCase(repo),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: FolderProvidersEnum.GET_FOLDER_BY_ID_USE_CASE,
      useFactory: (repo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new GetFolderByIdUseCase(repo, ex),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: FolderProvidersEnum.UPDATE_FOLDER_USE_CASE,
      useFactory: (repo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new UpdateFolderUseCase(repo, ex),
    },
    {
      inject: [FolderProvidersEnum.FOLDER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: FolderProvidersEnum.DELETE_FOLDER_USE_CASE,
      useFactory: (repo: FolderRepositoryInterface, ex: ExceptionServiceInterface) =>
        new DeleteFolderUseCase(repo, ex),
    },
  ],
  exports: [FolderProvidersEnum.FOLDER_REPOSITORY],
})
export class FoldersModule {}
