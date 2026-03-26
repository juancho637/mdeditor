import type { Group } from '../types/group.type';
import type { GroupWithMembers } from '../types/group-with-members.type';

export interface GroupRepository {
  create(name: string): Promise<Group>;
  list(): Promise<Group[]>;
  getById(id: string): Promise<GroupWithMembers>;
  update(id: string, name: string): Promise<Group>;
  delete(id: string): Promise<void>;
  addUser(groupId: string, userId: string): Promise<void>;
  removeUser(groupId: string, userId: string): Promise<void>;
}
