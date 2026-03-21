import { Body, Controller, Inject, Post } from '@nestjs/common';
import { AuthUseCasesEnum } from '../../domain';
import { SetupUseCase } from '../../application';
import { SetupDto } from '../dto/setup.dto';

@Controller()
export class SetupController {
  constructor(
    @Inject(AuthUseCasesEnum.SETUP_USE_CASE)
    private readonly setupUseCase: SetupUseCase,
  ) {}

  @Post('api/auth/setup')
  async run(@Body() dto: SetupDto) {
    const tokens = await this.setupUseCase.run({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
