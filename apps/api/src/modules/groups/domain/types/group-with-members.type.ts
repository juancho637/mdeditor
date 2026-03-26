import { UserType } from '@modules/users/domain';

export type GroupWithMembersType = {
  id: string;
  name: string;
  createdAt: Date;
  members: UserType[];
};
