import { Entity, PrimaryColumn } from 'typeorm';

@Entity('user_groups')
export class UserGroupEntity {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'group_id' })
  groupId!: string;
}
