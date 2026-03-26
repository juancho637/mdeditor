import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('folder_permissions')
@Unique(['folderId', 'groupId'])
export class FolderPermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'folder_id' })
  folderId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'varchar', name: 'permission_level' })
  permissionLevel!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
