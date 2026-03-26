import { InvitationStatus } from './invitation-status.enum';

export interface InvitationPublic {
  email: string;
  status: InvitationStatus;
}
