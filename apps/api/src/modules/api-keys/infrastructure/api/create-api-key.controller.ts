import { Body, Controller, Inject, Post } from '@nestjs/common';

import { Auth, AuthUser } from '@common/helpers/infrastructure/decorators';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';

import { ApiKeyProvidersEnum } from '../../domain';
import { CreateApiKeyUseCase } from '../../application';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Controller()
export class CreateApiKeyController {
  constructor(
    @Inject(ApiKeyProvidersEnum.CREATE_API_KEY_USE_CASE)
    private readonly createApiKeyUseCase: CreateApiKeyUseCase,
  ) {}

  @Post('api/mcp/keys')
  @Auth()
  async run(
    @Body() dto: CreateApiKeyDto,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const { apiKey, rawKey } = await this.createApiKeyUseCase.run({
      userId: authUser.id,
      name: dto.name,
    });

    return {
      api_key: rawKey,
      prefix: apiKey.prefix,
      name: apiKey.name,
      id: apiKey.id,
      created_at: apiKey.createdAt.toISOString(),
    };
  }
}
