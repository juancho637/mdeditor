import {
  Controller,
  Delete,
  Inject,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { Auth, AuthUser } from '@common/helpers/infrastructure/decorators';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';

import { ApiKeyProvidersEnum } from '../../domain';
import { RevokeApiKeyUseCase } from '../../application';

@Controller()
export class RevokeApiKeyController {
  constructor(
    @Inject(ApiKeyProvidersEnum.REVOKE_API_KEY_USE_CASE)
    private readonly revokeApiKeyUseCase: RevokeApiKeyUseCase,
  ) {}

  @Delete('api/mcp/keys/:id')
  @Auth()
  async run(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    await this.revokeApiKeyUseCase.run({
      id,
      userId: authUser.id,
    });

    return { revoked: true };
  }
}
