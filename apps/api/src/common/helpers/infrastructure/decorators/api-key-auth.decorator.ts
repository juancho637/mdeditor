import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../guards';

export function ApiKeyAuth() {
  return applyDecorators(UseGuards(ApiKeyAuthGuard));
}
