export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted';
  invitationLink?: string;
  invitedBy: string;
  createdAt: string;
  acceptedAt: string | null;
}
