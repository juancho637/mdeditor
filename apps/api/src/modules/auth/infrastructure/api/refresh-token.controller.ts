import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthUseCasesEnum } from '../../domain';
import { RefreshTokenUseCase } from '../../application';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Controller()
@UseGuards(ThrottlerGuard)
export class RefreshTokenController {
  constructor(
    @Inject(AuthUseCasesEnum.REFRESH_TOKEN_USE_CASE)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('api/auth/refresh')
  async run(@Body() dto: RefreshTokenDto) {
    const tokens = await this.refreshTokenUseCase.run(dto.refresh_token);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
