import { Body, Controller, ForbiddenException, Inject, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { InvitationProvidersEnum } from '../../domain';
import { CreateInvitationUseCase } from '../../application';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { InvitationPresenter } from '../presenters/invitation.presenter';

@Controller()
export class CreateInvitationController {
  constructor(
    @Inject(InvitationProvidersEnum.CREATE_INVITATION_USE_CASE)
    private readonly createInvitationUseCase: CreateInvitationUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('api/invitations')
  @Auth()
  async run(@Body() dto: CreateInvitationDto, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }

    const invitation = await this.createInvitationUseCase.run({
      email: dto.email,
      invitedBy: authUser.id,
    });

    const frontendUrl = this.configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
    return InvitationPresenter.toResponse(invitation, frontendUrl);
  }
}
