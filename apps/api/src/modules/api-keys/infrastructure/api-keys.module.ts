import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ExceptionProvidersEnum,
  ExceptionServiceInterface,
} from '@common/exception/domain';

import { ApiKeyProvidersEnum, ApiKeyRepositoryInterface } from '../domain';
import {
  ValidateApiKeyUseCase,
  CreateApiKeyUseCase,
  ListApiKeysUseCase,
  RevokeApiKeyUseCase,
} from '../application';
import { ApiKeyEntity } from './persistence/api-key.entity';
import { ApiKeyOrmRepository } from './persistence/api-key-orm.repository';
import { CreateApiKeyController } from './api/create-api-key.controller';
import { ListApiKeysController } from './api/list-api-keys.controller';
import { RevokeApiKeyController } from './api/revoke-api-key.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  controllers: [
    CreateApiKeyController,
    ListApiKeysController,
    RevokeApiKeyController,
  ],
  providers: [
    {
      inject: [
        getRepositoryToken(ApiKeyEntity),
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: ApiKeyProvidersEnum.API_KEY_REPOSITORY,
      useFactory: (
        repo: Repository<ApiKeyEntity>,
        ex: ExceptionServiceInterface,
      ) => new ApiKeyOrmRepository(repo, ex),
    },
    {
      inject: [
        ApiKeyProvidersEnum.API_KEY_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: ApiKeyProvidersEnum.VALIDATE_API_KEY_USE_CASE,
      useFactory: (
        repo: ApiKeyRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new ValidateApiKeyUseCase(repo, ex),
    },
    {
      inject: [
        ApiKeyProvidersEnum.API_KEY_REPOSITORY,
        ExceptionProvidersEnum.EXCEPTION_SERVICE,
      ],
      provide: ApiKeyProvidersEnum.CREATE_API_KEY_USE_CASE,
      useFactory: (
        repo: ApiKeyRepositoryInterface,
        ex: ExceptionServiceInterface,
      ) => new CreateApiKeyUseCase(repo, ex),
    },
    {
      inject: [ApiKeyProvidersEnum.API_KEY_REPOSITORY],
      provide: ApiKeyProvidersEnum.LIST_API_KEYS_USE_CASE,
      useFactory: (repo: ApiKeyRepositoryInterface) =>
        new ListApiKeysUseCase(repo),
    },
    {
      inject: [ApiKeyProvidersEnum.API_KEY_REPOSITORY],
      provide: ApiKeyProvidersEnum.REVOKE_API_KEY_USE_CASE,
      useFactory: (repo: ApiKeyRepositoryInterface) =>
        new RevokeApiKeyUseCase(repo),
    },
  ],
  exports: [
    ApiKeyProvidersEnum.CREATE_API_KEY_USE_CASE,
    ApiKeyProvidersEnum.VALIDATE_API_KEY_USE_CASE,
  ],
})
export class ApiKeysModule {}
