import { InvitationStatus } from '../enums/invitation-status.enum';

export type InvitationType = {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: Date;
  acceptedAt: Date | null;
};
