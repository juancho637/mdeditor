import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthUseCasesEnum } from '../../domain';
import { SignInUseCase } from '../../application';
import { SignInDto } from '../dto/sign-in.dto';
import { setRefreshTokenCookie } from '@common/helpers/infrastructure/utils/cookie.utils';

@Controller()
@UseGuards(ThrottlerGuard)
@SkipThrottle({ default: true })
export class SignInController {
  constructor(
    @Inject(AuthUseCasesEnum.SIGN_IN_USE_CASE)
    private readonly signInUseCase: SignInUseCase,
  ) {}

  @Post('api/auth/sign-in')
  async run(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.signInUseCase.run({
      email: dto.email,
      password: dto.password,
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
    };
  }
}
