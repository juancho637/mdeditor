import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocumentEntity } from './document.entity';

// Append-only table: snapshots are immutable by design (NFR16). No DELETE/UPDATE endpoints exist.
@Entity('document_snapshots')
@Index('idx_document_snapshots_document_id_created_at', ['documentId', 'createdAt'])
export class DocumentSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'document_id' })
  documentId!: string;

  @Column({ type: 'bytea', name: 'yjs_snapshot' })
  yjsSnapshot!: Buffer;

  @Column({ type: 'text', name: 'content_markdown' })
  contentMarkdown!: string;

  @Column({ type: 'uuid', name: 'author_id', nullable: true })
  authorId!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => DocumentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: DocumentEntity;
}
