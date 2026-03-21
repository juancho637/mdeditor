import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './persistence/user.entity';
import { UserOrmRepository } from './persistence/user-orm.repository';
import { UsersProvidersEnum, UserRepositoryInterface } from '../domain';
import { CreateUserUseCase } from '../application';
import { ExceptionProvidersEnum, ExceptionServiceInterface } from '@common/exception/domain';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      inject: [getRepositoryToken(UserEntity), ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: UsersProvidersEnum.USER_REPOSITORY,
      useFactory: (
        repository: Repository<UserEntity>,
        exception: ExceptionServiceInterface,
      ) => new UserOrmRepository(repository, exception),
    },
    {
      inject: [UsersProvidersEnum.USER_REPOSITORY, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      provide: UsersProvidersEnum.CREATE_USER_USE_CASE,
      useFactory: (
        userRepository: UserRepositoryInterface,
        exception: ExceptionServiceInterface,
      ) => new CreateUserUseCase(userRepository, exception),
    },
  ],
  exports: [
    UsersProvidersEnum.USER_REPOSITORY,
    UsersProvidersEnum.CREATE_USER_USE_CASE,
  ],
})
export class UsersModule {}
