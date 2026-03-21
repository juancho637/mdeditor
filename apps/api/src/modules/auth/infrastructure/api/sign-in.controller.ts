import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthUseCasesEnum } from '../../domain';
import { SignInUseCase } from '../../application';
import { SignInDto } from '../dto/sign-in.dto';

@Controller()
@UseGuards(ThrottlerGuard)
@SkipThrottle({ default: true })
export class SignInController {
  constructor(
    @Inject(AuthUseCasesEnum.SIGN_IN_USE_CASE)
    private readonly signInUseCase: SignInUseCase,
  ) {}

  @Post('api/auth/sign-in')
  async run(@Body() dto: SignInDto) {
    const tokens = await this.signInUseCase.run({
      email: dto.email,
      password: dto.password,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
