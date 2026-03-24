import type { Invitation } from '../types/invitation.type';
import type { InvitationPublic } from '../types/invitation-public.type';
import type { CreateInvitationRequest } from '../types/create-invitation-request.type';
import type { AcceptInvitationRequest } from '../types/accept-invitation-request.type';

export interface InvitationRepository {
  create(data: CreateInvitationRequest): Promise<Invitation>;
  getByToken(token: string): Promise<InvitationPublic>;
  acceptInvitation(token: string, data: AcceptInvitationRequest): Promise<{ accessToken: string }>;
  list(): Promise<Invitation[]>;
}
