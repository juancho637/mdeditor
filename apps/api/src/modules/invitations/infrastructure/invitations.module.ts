import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationEntity } from './persistence/invitation.entity';
import { InvitationOrmRepository } from './persistence/invitation-orm.repository';
import { CreateInvitationController } from './api/create-invitation.controller';
import { AcceptInvitationController } from './api/accept-invitation.controller';
import { GetInvitationController } from './api/get-invitation.controller';
import { ListInvitationsController } from './api/list-invitations.controller';
import {
  InvitationProvidersEnum,
  InvitationRepositoryInterface,
} from '../domain';
import {
  CreateInvitationUseCase,
  AcceptInvitationUseCase,
  GetInvitationByTokenUseCase,
  ListInvitationsUseCase,
} from '../application';
import {
  UsersProvidersEnum,
  UserRepositoryInterface,
} from '@modules/users/domain';
import { CreateUserUseCase } from '@modules/users/application';
import { UsersModule } from '@modules/users/infrastructure';
import { AuthUseCasesEnum, AuthServiceInterface } from '@modules/auth/domain';
import { AuthModule } from '@modules/auth/infrastructure';
import {
  ExceptionProvidersEnum,
  ExceptionServiceInterface,
} from '@common/exception/domain';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationEntity]),
    UsersModule,
    AuthModule,
  ],
  controllers: [
    CreateInvitationController,
    AcceptInvitationController,
    GetInvitationController,
    ListInvitationsController,
  ],
  providers: [
    {
      inject: [getRepositoryToken(InvitationEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: InvitationProvidersEnum.INVITATION_REPOSITORY,
      useFactory: (
        repository: Repository<InvitationEntity>,
        exception: ExceptionServiceInterface,
      ) => new InvitationOrmRepository(repository, exception),
    },
    {
      inject: [
        InvitationProvidersEnum.INVITATION_REPOSITORY,
        UsersProvidersEnum.USER_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: InvitationProvidersEnum.CREATE_INVITATION_USE_CASE,
      useFactory: (
        invitationRepository: InvitationRepositoryInterface,
        userRepository: UserRepositoryInterface,
        exception: ExceptionServiceInterface,
      ) => new CreateInvitationUseCase(invitationRepository, userRepository, exception),
    },
    {
      inject: [
        InvitationProvidersEnum.INVITATION_REPOSITORY,
        UsersProvidersEnum.CREATE_USER_USE_CASE,
        AuthUseCasesEnum.AUTH_SERVICE,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: InvitationProvidersEnum.ACCEPT_INVITATION_USE_CASE,
      useFactory: (
        invitationRepository: InvitationRepositoryInterface,
        createUserUseCase: CreateUserUseCase,
        authService: AuthServiceInterface,
        exception: ExceptionServiceInterface,
      ) => new AcceptInvitationUseCase(invitationRepository, createUserUseCase, authService, exception),
    },
    {
      inject: [
        InvitationProvidersEnum.INVITATION_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: InvitationProvidersEnum.GET_INVITATION_BY_TOKEN_USE_CASE,
      useFactory: (
        invitationRepository: InvitationRepositoryInterface,
        exception: ExceptionServiceInterface,
      ) => new GetInvitationByTokenUseCase(invitationRepository, exception),
    },
    {
      inject: [InvitationProvidersEnum.INVITATION_REPOSITORY],
      provide: InvitationProvidersEnum.LIST_INVITATIONS_USE_CASE,
      useFactory: (invitationRepository: InvitationRepositoryInterface) =>
        new ListInvitationsUseCase(invitationRepository),
    },
  ],
})
export class InvitationsModule {}
