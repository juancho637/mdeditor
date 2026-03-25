import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('invitations')
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', unique: true })
  token!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: string;

  @Column({ type: 'uuid', name: 'invited_by' })
  invitedBy!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', name: 'accepted_at', nullable: true })
  acceptedAt!: Date | null;
}
