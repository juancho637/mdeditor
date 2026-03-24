import { Controller, Get, Inject, Param } from '@nestjs/common';
import { InvitationProvidersEnum } from '../../domain';
import { GetInvitationByTokenUseCase } from '../../application';
import { InvitationPresenter } from '../presenters/invitation.presenter';

@Controller()
export class GetInvitationController {
  constructor(
    @Inject(InvitationProvidersEnum.GET_INVITATION_BY_TOKEN_USE_CASE)
    private readonly getInvitationByTokenUseCase: GetInvitationByTokenUseCase,
  ) {}

  @Get('api/invitations/:token')
  async run(@Param('token') token: string) {
    const invitation = await this.getInvitationByTokenUseCase.run(token);
    return InvitationPresenter.toPublicResponse(invitation);
  }
}
