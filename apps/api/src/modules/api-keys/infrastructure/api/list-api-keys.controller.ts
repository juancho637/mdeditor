import { Controller, Get, Inject } from '@nestjs/common';

import { Auth, AuthUser } from '@common/helpers/infrastructure/decorators';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';

import { ApiKeyProvidersEnum } from '../../domain';
import { ListApiKeysUseCase } from '../../application';
import { ApiKeyPresenter } from '../presenters/api-key.presenter';

@Controller()
export class ListApiKeysController {
  constructor(
    @Inject(ApiKeyProvidersEnum.LIST_API_KEYS_USE_CASE)
    private readonly listApiKeysUseCase: ListApiKeysUseCase,
  ) {}

  @Get('api/mcp/keys')
  @Auth()
  async run(@AuthUser() authUser: AuthenticatedUserType) {
    const apiKeys = await this.listApiKeysUseCase.run({
      userId: authUser.id,
    });

    return apiKeys.map(ApiKeyPresenter.toResponse);
  }
}
