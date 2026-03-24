import { InvitationType } from '../types/invitation.type';

export interface InvitationRepositoryInterface {
  create(data: { email: string; token: string; invitedBy: string }): Promise<InvitationType>;
  findByToken(token: string): Promise<InvitationType | null>;
  findPendingByEmail(email: string): Promise<InvitationType | null>;
  findAll(): Promise<InvitationType[]>;
  markAccepted(id: string): Promise<void>;
}
