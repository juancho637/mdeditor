import { InvitationRepositoryInterface, InvitationType } from '../../domain';

export class ListInvitationsUseCase {
  constructor(
    private readonly invitationRepository: InvitationRepositoryInterface,
  ) {}

  async run(): Promise<InvitationType[]> {
    return this.invitationRepository.findAll();
  }
}
