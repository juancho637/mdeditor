import { CreateUserUseCase } from '@modules/users/application';
import {
  InvitationRepositoryInterface,
  InvitationStatus,
  invitationErrorsCodes,
} from '../../domain';
import { AuthServiceInterface, SignInType } from '@modules/auth/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class AcceptInvitationUseCase {
  private readonly context = AcceptInvitationUseCase.name;

  constructor(
    private readonly invitationRepository: InvitationRepositoryInterface,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { token: string; name: string; password: string }): Promise<SignInType> {
    const invitation = await this.invitationRepository.findByToken(data.token);
    if (!invitation) {
      throw this.exception.notFoundException({
        message: invitationErrorsCodes.INV001,
        context: this.context,
      });
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw this.exception.badRequestException({
        message: invitationErrorsCodes.INV002,
        context: this.context,
      });
    }

    const user = await this.createUserUseCase.run({
      name: data.name,
      email: invitation.email,
      password: data.password,
      isAdmin: false,
    });

    await this.invitationRepository.markAccepted(invitation.id);

    return this.authService.generateTokens({
      sub: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
