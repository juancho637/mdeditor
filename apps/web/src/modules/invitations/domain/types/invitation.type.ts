import { InvitationStatus } from './invitation-status.enum';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  invitationLink?: string;
  invitedBy: string;
  createdAt: string;
  acceptedAt: string | null;
}
