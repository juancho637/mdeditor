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

@Entity('document_updates')
@Index('idx_document_updates_document_id_created_at', ['documentId', 'createdAt'])
export class DocumentUpdateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'document_id' })
  documentId!: string;

  @Column({ type: 'bytea', name: 'yjs_update' })
  yjsUpdate!: Buffer;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => DocumentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document!: DocumentEntity;
}
