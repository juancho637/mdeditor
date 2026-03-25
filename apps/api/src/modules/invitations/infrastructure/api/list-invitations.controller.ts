import { Controller, ForbiddenException, Get, Inject } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
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
  async run(@AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }

    const invitations = await this.listInvitationsUseCase.run();
    return invitations.map((inv) => InvitationPresenter.toResponse(inv));
  }
}
