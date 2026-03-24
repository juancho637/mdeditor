import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthUseCasesEnum } from '../../domain';
import { SetupUseCase } from '../../application';
import { SetupDto } from '../dto/setup.dto';
import { setRefreshTokenCookie } from '@common/helpers/infrastructure/utils/cookie.utils';

@Controller()
export class SetupController {
  constructor(
    @Inject(AuthUseCasesEnum.SETUP_USE_CASE)
    private readonly setupUseCase: SetupUseCase,
  ) {}

  @Post('api/auth/setup')
  async run(@Body() dto: SetupDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.setupUseCase.run({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
    };
  }
}
