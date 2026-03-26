import { GroupType } from '../types/group.type';
import { GroupWithMembersType } from '../types/group-with-members.type';
import { UserType } from '@modules/users/domain';

export interface GroupRepositoryInterface {
  create(name: string): Promise<GroupType>;
  findById(id: string): Promise<GroupType | null>;
  findByIdWithMembers(id: string): Promise<GroupWithMembersType | null>;
  findByName(name: string): Promise<GroupType | null>;
  findAll(): Promise<GroupType[]>;
  update(id: string, name: string): Promise<GroupType>;
  delete(id: string): Promise<void>;
  addUser(groupId: string, userId: string): Promise<void>;
  removeUser(groupId: string, userId: string): Promise<void>;
  isUserInGroup(groupId: string, userId: string): Promise<boolean>;
  findMembers(groupId: string): Promise<UserType[]>;
  findGroupIdsByUserId(userId: string): Promise<string[]>;
}
