import { createHash } from 'crypto';
import { Controller, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthUseCasesEnum, TokenRevocationRepositoryInterface } from '../../domain';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '@common/helpers/infrastructure/utils/cookie.utils';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Controller()
export class LogoutController {
  constructor(
    @Inject(AuthUseCasesEnum.TOKEN_REVOCATION_REPOSITORY)
    private readonly tokenRevocation: TokenRevocationRepositoryInterface,
  ) {}

  @Post('api/auth/logout')
  async run(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await this.tokenRevocation.revoke(tokenHash, REFRESH_TOKEN_TTL_SECONDS);
    }

    clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }
}
