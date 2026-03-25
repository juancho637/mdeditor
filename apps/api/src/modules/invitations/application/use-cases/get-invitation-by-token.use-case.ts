import { InvitationRepositoryInterface, InvitationType, invitationErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GetInvitationByTokenUseCase {
  private readonly context = GetInvitationByTokenUseCase.name;

  constructor(
    private readonly invitationRepository: InvitationRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(token: string): Promise<InvitationType> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) {
      throw this.exception.notFoundException({
        message: invitationErrorsCodes.INV001,
        context: this.context,
      });
    }

    return invitation;
  }
}
