import { InvitationType } from '../../domain/types/invitation.type';

export class InvitationPresenter {
  static toResponse(invitation: InvitationType, frontendUrl?: string) {
    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      invitation_link: frontendUrl ? `${frontendUrl}/invite/${invitation.token}` : undefined,
      invited_by: invitation.invitedBy,
      created_at: invitation.createdAt.toISOString(),
      accepted_at: invitation.acceptedAt?.toISOString() ?? null,
    };
  }

  static toPublicResponse(invitation: InvitationType) {
    return {
      email: invitation.email,
      status: invitation.status,
    };
  }
}
