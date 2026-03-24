import { Controller, Get, Inject } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { InvitationProvidersEnum } from '../../domain';
import { ListInvitationsUseCase } from '../../application';
import { InvitationPresenter } from '../presenters/invitation.presenter';

@Controller()
export class ListInvitationsController {
  constructor(
    @Inject(InvitationProvidersEnum.LIST_INVITATIONS_USE_CASE)
    private readonly listInvitationsUseCase: ListInvitationsUseCase,
  ) {}

  @Get('api/invitations')
  @Auth()
  async run() {
    const invitations = await this.listInvitationsUseCase.run();
    return invitations.map((inv) => InvitationPresenter.toResponse(inv));
  }
}
