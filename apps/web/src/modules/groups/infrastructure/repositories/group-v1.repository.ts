import { apiClient } from '@/common/adapters/api-client';
import type { GroupRepository } from '../../domain/repositories/group-repository';
import type { Group } from '../../domain/types/group.type';
import type { GroupWithMembers } from '../../domain/types/group-with-members.type';

interface GroupWireResponse {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
}

interface GroupDetailWireResponse {
  id: string;
  name: string;
  created_at: string;
  members: Array<{ id: string; name: string; email: string }>;
}

function mapGroup(wire: GroupWireResponse): Group {
  return {
    id: wire.id,
    name: wire.name,
    memberCount: wire.member_count,
    createdAt: wire.created_at,
  };
}

function mapGroupDetail(wire: GroupDetailWireResponse): GroupWithMembers {
  return {
    id: wire.id,
    name: wire.name,
    createdAt: wire.created_at,
    members: wire.members,
  };
}

export class GroupV1Repository implements GroupRepository {
  async create(name: string): Promise<Group> {
    const response = await apiClient.post<GroupWireResponse>('/api/groups', { name });
    return mapGroup(response.data);
  }

  async list(): Promise<Group[]> {
    const response = await apiClient.get<GroupWireResponse[]>('/api/groups');
    return (response.data as GroupWireResponse[]).map(mapGroup);
  }

  async getById(id: string): Promise<GroupWithMembers> {
    const response = await apiClient.get<GroupDetailWireResponse>(`/api/groups/${id}`);
    return mapGroupDetail(response.data);
  }

  async update(id: string, name: string): Promise<Group> {
    const response = await apiClient.put<GroupWireResponse>(`/api/groups/${id}`, { name });
    return mapGroup(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/groups/${id}`);
  }

  async addUser(groupId: string, userId: string): Promise<void> {
    await apiClient.post(`/api/groups/${groupId}/users`, { user_id: userId });
  }

  async removeUser(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/groups/${groupId}/users/${userId}`);
  }
}

export const groupRepository = new GroupV1Repository();
