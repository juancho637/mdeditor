import { Body, Controller, Inject, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { InvitationProvidersEnum } from '../../domain';
import { AcceptInvitationUseCase } from '../../application';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { setRefreshTokenCookie } from '@common/helpers/infrastructure/utils/cookie.utils';

@Controller()
export class AcceptInvitationController {
  constructor(
    @Inject(InvitationProvidersEnum.ACCEPT_INVITATION_USE_CASE)
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
  ) {}

  @Post('api/invitations/:token/accept')
  async run(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.acceptInvitationUseCase.run({
      token,
      name: dto.name,
      password: dto.password,
    });

    setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
    };
  }
}
