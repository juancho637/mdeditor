import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderPermissionEntity } from './persistence/folder-permission.entity';
import { PermissionOrmRepository } from './persistence/permission-orm.repository';
import { SetPermissionController } from './api/set-permission.controller';
import { GetPermissionsController } from './api/get-permissions.controller';
import { DeletePermissionController } from './api/delete-permission.controller';
import { GetMyPermissionsController } from './api/get-my-permissions.controller';
import {
  PermissionProvidersEnum,
  PermissionRepositoryInterface,
} from '../domain';
import {
  SetPermissionUseCase,
  GetPermissionMatrixUseCase,
  GetFolderPermissionsUseCase,
  CheckPermissionUseCase,
  GetUserPermissionsUseCase,
} from '../application';
import { UsersProvidersEnum, UserRepositoryInterface } from '@modules/users/domain';
import { UsersModule } from '@modules/users/infrastructure';
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
    UsersModule,
  ],
  controllers: [
    SetPermissionController,
    GetPermissionsController,
    DeletePermissionController,
    GetMyPermissionsController,
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
    {
      inject: [
        PermissionProvidersEnum.PERMISSION_REPOSITORY,
        GroupProvidersEnum.GROUP_REPOSITORY,
        UsersProvidersEnum.USER_REPOSITORY,
      ],
      provide: PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
      useFactory: (
        permRepo: PermissionRepositoryInterface,
        groupRepo: GroupRepositoryInterface,
        userRepo: UserRepositoryInterface,
      ) => new CheckPermissionUseCase(permRepo, groupRepo, userRepo),
    },
    {
      inject: [
        PermissionProvidersEnum.PERMISSION_REPOSITORY,
        GroupProvidersEnum.GROUP_REPOSITORY,
        UsersProvidersEnum.USER_REPOSITORY,
        FolderProvidersEnum.FOLDER_REPOSITORY,
      ],
      provide: PermissionProvidersEnum.GET_USER_PERMISSIONS_USE_CASE,
      useFactory: (
        permRepo: PermissionRepositoryInterface,
        groupRepo: GroupRepositoryInterface,
        userRepo: UserRepositoryInterface,
        folderRepo: FolderRepositoryInterface,
      ) => new GetUserPermissionsUseCase(permRepo, groupRepo, userRepo, folderRepo),
    },
  ],
  exports: [
    PermissionProvidersEnum.PERMISSION_REPOSITORY,
    PermissionProvidersEnum.GET_FOLDER_PERMISSIONS_USE_CASE,
    PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
  ],
})
export class PermissionsModule {}
