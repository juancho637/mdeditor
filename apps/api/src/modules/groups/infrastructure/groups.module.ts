import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './persistence/group.entity';
import { UserGroupEntity } from './persistence/user-group.entity';
import { UserEntity } from '@modules/users/infrastructure/persistence/user.entity';
import { GroupOrmRepository } from './persistence/group-orm.repository';
import { CreateGroupController } from './api/create-group.controller';
import { ListGroupsController } from './api/list-groups.controller';
import { GetGroupController } from './api/get-group.controller';
import { UpdateGroupController } from './api/update-group.controller';
import { DeleteGroupController } from './api/delete-group.controller';
import { AddUserToGroupController } from './api/add-user-to-group.controller';
import { RemoveUserFromGroupController } from './api/remove-user-from-group.controller';
import {
  GroupProvidersEnum,
  GroupRepositoryInterface,
} from '../domain';
import {
  CreateGroupUseCase,
  ListGroupsUseCase,
  GetGroupByIdUseCase,
  UpdateGroupUseCase,
  DeleteGroupUseCase,
  AddUserToGroupUseCase,
  RemoveUserFromGroupUseCase,
} from '../application';
import { UsersProvidersEnum, UserRepositoryInterface } from '@modules/users/domain';
import { UsersModule } from '@modules/users/infrastructure';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity, UserGroupEntity, UserEntity]),
    UsersModule,
  ],
  controllers: [
    CreateGroupController,
    ListGroupsController,
    GetGroupController,
    UpdateGroupController,
    DeleteGroupController,
    AddUserToGroupController,
    RemoveUserFromGroupController,
  ],
  providers: [
    {
      inject: [
        getRepositoryToken(GroupEntity),
        getRepositoryToken(UserGroupEntity),
        getRepositoryToken(UserEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: GroupProvidersEnum.GROUP_REPOSITORY,
      useFactory: (
        groupRepo: Repository<GroupEntity>,
        userGroupRepo: Repository<UserGroupEntity>,
        userRepo: Repository<UserEntity>,
        exception: ExceptionServiceInterface,
      ) => new GroupOrmRepository(groupRepo, userGroupRepo, userRepo, exception),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: GroupProvidersEnum.CREATE_GROUP_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface, ex: ExceptionServiceInterface) =>
        new CreateGroupUseCase(repo, ex),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY],
      provide: GroupProvidersEnum.LIST_GROUPS_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface) => new ListGroupsUseCase(repo),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: GroupProvidersEnum.GET_GROUP_BY_ID_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface, ex: ExceptionServiceInterface) =>
        new GetGroupByIdUseCase(repo, ex),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: GroupProvidersEnum.UPDATE_GROUP_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface, ex: ExceptionServiceInterface) =>
        new UpdateGroupUseCase(repo, ex),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: GroupProvidersEnum.DELETE_GROUP_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface, ex: ExceptionServiceInterface) =>
        new DeleteGroupUseCase(repo, ex),
    },
    {
      inject: [
        GroupProvidersEnum.GROUP_REPOSITORY,
        UsersProvidersEnum.USER_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: GroupProvidersEnum.ADD_USER_TO_GROUP_USE_CASE,
      useFactory: (
        groupRepo: GroupRepositoryInterface,
        userRepo: UserRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new AddUserToGroupUseCase(groupRepo, userRepo, ex),
    },
    {
      inject: [GroupProvidersEnum.GROUP_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: GroupProvidersEnum.REMOVE_USER_FROM_GROUP_USE_CASE,
      useFactory: (repo: GroupRepositoryInterface, ex: ExceptionServiceInterface) =>
        new RemoveUserFromGroupUseCase(repo, ex),
    },
  ],
  exports: [GroupProvidersEnum.GROUP_REPOSITORY],
})
export class GroupsModule {}
