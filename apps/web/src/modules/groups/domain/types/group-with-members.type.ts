export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface GroupWithMembers {
  id: string;
  name: string;
  createdAt: string;
  members: GroupMember[];
}
