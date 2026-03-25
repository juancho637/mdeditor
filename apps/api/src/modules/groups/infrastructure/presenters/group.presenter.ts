import { GroupType, GroupWithMembersType } from '../../domain';

export class GroupPresenter {
  static toResponse(group: GroupType) {
    return {
      id: group.id,
      name: group.name,
      member_count: group.memberCount,
      created_at: group.createdAt.toISOString(),
    };
  }

  static toDetailResponse(group: GroupWithMembersType) {
    return {
      id: group.id,
      name: group.name,
      created_at: group.createdAt.toISOString(),
      members: group.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
      })),
    };
  }
}
