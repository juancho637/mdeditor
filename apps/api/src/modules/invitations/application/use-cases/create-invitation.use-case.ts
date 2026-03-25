import { randomUUID } from 'crypto';
import { UserRepositoryInterface } from '@modules/users/domain';
import { InvitationRepositoryInterface, InvitationType, invitationErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class CreateInvitationUseCase {
  private readonly context = CreateInvitationUseCase.name;

  constructor(
    private readonly invitationRepository: InvitationRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { email: string; invitedBy: string }): Promise<InvitationType> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw this.exception.badRequestException({
        message: invitationErrorsCodes.INV003,
        context: this.context,
      });
    }

    const pendingInvitation = await this.invitationRepository.findPendingByEmail(normalizedEmail);
    if (pendingInvitation) {
      throw this.exception.badRequestException({
        message: invitationErrorsCodes.INV004,
        context: this.context,
      });
    }

    const token = randomUUID();

    return this.invitationRepository.create({
      email: normalizedEmail,
      token,
      invitedBy: data.invitedBy,
    });
  }
}
