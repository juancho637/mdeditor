import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderPermissionEntity } from './persistence/folder-permission.entity';
import { PermissionOrmRepository } from './persistence/permission-orm.repository';
import { SetPermissionController } from './api/set-permission.controller';
import { GetPermissionsController } from './api/get-permissions.controller';
import { DeletePermissionController } from './api/delete-permission.controller';
import {
  PermissionProvidersEnum,
  PermissionRepositoryInterface,
} from '../domain';
import {
  SetPermissionUseCase,
  GetPermissionMatrixUseCase,
  GetFolderPermissionsUseCase,
} from '../application';
import { FolderProvidersEnum, FolderRepositoryInterface } from '@modules/folders/domain';
import { FoldersModule } from '@modules/folders/infrastructure';
import { GroupProvidersEnum, GroupRepositoryInterface } from '@modules/groups/domain';
import { GroupsModule } from '@modules/groups/infrastructure';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';

@Module({
  imports: [
    TypeOrmModule.forFeature([FolderPermissionEntity]),
    FoldersModule,
    GroupsModule,
  ],
  controllers: [
    SetPermissionController,
    GetPermissionsController,
    DeletePermissionController,
  ],
  providers: [
    {
      inject: [getRepositoryToken(FolderPermissionEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: PermissionProvidersEnum.PERMISSION_REPOSITORY,
      useFactory: (repo: Repository<FolderPermissionEntity>, ex: ExceptionServiceInterface) =>
        new PermissionOrmRepository(repo, ex),
    },
    {
      inject: [
        PermissionProvidersEnum.PERMISSION_REPOSITORY,
        FolderProvidersEnum.FOLDER_REPOSITORY,
        GroupProvidersEnum.GROUP_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: PermissionProvidersEnum.SET_PERMISSION_USE_CASE,
      useFactory: (
        permRepo: PermissionRepositoryInterface,
        folderRepo: FolderRepositoryInterface,
        groupRepo: GroupRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new SetPermissionUseCase(permRepo, folderRepo, groupRepo, ex),
    },
    {
      inject: [PermissionProvidersEnum.PERMISSION_REPOSITORY],
      provide: PermissionProvidersEnum.GET_PERMISSION_MATRIX_USE_CASE,
      useFactory: (repo: PermissionRepositoryInterface) => new GetPermissionMatrixUseCase(repo),
    },
    {
      inject: [PermissionProvidersEnum.PERMISSION_REPOSITORY],
      provide: PermissionProvidersEnum.GET_FOLDER_PERMISSIONS_USE_CASE,
      useFactory: (repo: PermissionRepositoryInterface) => new GetFolderPermissionsUseCase(repo),
    },
  ],
  exports: [PermissionProvidersEnum.PERMISSION_REPOSITORY, PermissionProvidersEnum.GET_FOLDER_PERMISSIONS_USE_CASE],
})
export class PermissionsModule {}
