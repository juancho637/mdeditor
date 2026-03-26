import { apiClient } from '@/common/adapters/api-client';
import type { InvitationRepository } from '../../domain/repositories/invitation-repository';
import type { Invitation } from '../../domain/types/invitation.type';
import type { InvitationPublic } from '../../domain/types/invitation-public.type';
import type { CreateInvitationRequest } from '../../domain/types/create-invitation-request.type';
import { InvitationStatus } from '../../domain/types/invitation-status.enum';
import type { AcceptInvitationRequest } from '../../domain/types/accept-invitation-request.type';

interface InvitationWireResponse {
  id: string;
  email: string;
  token: string;
  status: string;
  invitation_link?: string;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
}

interface InvitationPublicWireResponse {
  email: string;
  status: string;
}

interface AcceptWireResponse {
  access_token: string;
}

function mapInvitation(wire: InvitationWireResponse): Invitation {
  return {
    id: wire.id,
    email: wire.email,
    token: wire.token,
    status: wire.status as InvitationStatus,
    invitationLink: wire.invitation_link,
    invitedBy: wire.invited_by,
    createdAt: wire.created_at,
    acceptedAt: wire.accepted_at,
  };
}

export class InvitationV1Repository implements InvitationRepository {
  async create(data: CreateInvitationRequest): Promise<Invitation> {
    const response = await apiClient.post<InvitationWireResponse>('/api/invitations', data);
    return mapInvitation(response.data);
  }

  async getByToken(token: string): Promise<InvitationPublic> {
    const response = await apiClient.get<InvitationPublicWireResponse>(`/api/invitations/${token}`);
    return {
      email: response.data.email,
      status: response.data.status as InvitationStatus,
    };
  }

  async acceptInvitation(token: string, data: AcceptInvitationRequest): Promise<{ accessToken: string }> {
    const response = await apiClient.post<AcceptWireResponse>(`/api/invitations/${token}/accept`, data);
    return { accessToken: response.data.access_token };
  }

  async list(): Promise<Invitation[]> {
    const response = await apiClient.get<InvitationWireResponse[]>('/api/invitations');
    return (response.data as InvitationWireResponse[]).map(mapInvitation);
  }
}

export const invitationRepository = new InvitationV1Repository();
