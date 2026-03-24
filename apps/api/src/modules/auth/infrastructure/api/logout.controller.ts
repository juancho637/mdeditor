import { Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { clearRefreshTokenCookie } from '@common/helpers/infrastructure/utils/cookie.utils';

@Controller()
export class LogoutController {
  @Post('api/auth/logout')
  async run(@Res({ passthrough: true }) res: Response) {
    clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }
}
