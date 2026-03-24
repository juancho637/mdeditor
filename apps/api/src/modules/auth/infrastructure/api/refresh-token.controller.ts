import { Controller, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthUseCasesEnum, authErrorsCodes } from '../../domain';
import { RefreshTokenUseCase } from '../../application';
import {
  setRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '@common/helpers/infrastructure/utils/cookie.utils';
import { ExceptionServiceInterface, ExceptionProvidersEnum } from '@common/exception/domain';

@Controller()
@UseGuards(ThrottlerGuard)
export class RefreshTokenController {
  constructor(
    @Inject(AuthUseCasesEnum.REFRESH_TOKEN_USE_CASE)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(ExceptionProvidersEnum.EXCEPTION_SERVICE)
    private readonly exception: ExceptionServiceInterface,
  ) {}

  @Post('api/auth/refresh')
  async run(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw this.exception.unauthorizedException({
        message: authErrorsCodes.AUT002,
        context: RefreshTokenController.name,
      });
    }

    const tokens = await this.refreshTokenUseCase.run(refreshToken);

    setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
    };
  }
}
