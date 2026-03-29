import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { ApiKeyProvidersEnum } from '../../domain';
import { ValidateApiKeyUseCase } from '../../application';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @Inject(ApiKeyProvidersEnum.VALIDATE_API_KEY_USE_CASE)
    private readonly validateApiKey: ValidateApiKeyUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code_error: 'AKY001', message: 'Invalid or revoked API key.' });
    }

    const rawKey = authHeader.substring(7);

    if (!rawKey.startsWith('mk_')) {
      throw new UnauthorizedException({ code_error: 'AKY001', message: 'Invalid or revoked API key.' });
    }

    try {
      const { userId } = await this.validateApiKey.run(rawKey);
      request['user'] = { id: userId, email: '', name: '', isAdmin: false };
      return true;
    } catch {
      throw new UnauthorizedException({ code_error: 'AKY001', message: 'Invalid or revoked API key.' });
    }
  }
}
