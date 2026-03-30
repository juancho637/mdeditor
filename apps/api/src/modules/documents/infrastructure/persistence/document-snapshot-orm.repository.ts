import { Repository } from 'typeorm';
import { DocumentSnapshotEntity } from './document-snapshot.entity';
import {
  DocumentSnapshotRepositoryInterface,
  collaborationErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DocumentSnapshotOrmRepository
  implements DocumentSnapshotRepositoryInterface
{
  constructor(
    private readonly repository: Repository<DocumentSnapshotEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async saveSnapshot(
    documentId: string,
    snapshot: Uint8Array,
    contentMarkdown: string,
    authorId?: string,
  ): Promise<void> {
    try {
      const entity = this.repository.create({
        documentId,
        yjsSnapshot: Buffer.from(snapshot),
        contentMarkdown,
        authorId: authorId ?? null,
      });
      await this.repository.save(entity);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: collaborationErrorsCodes.COL100,
        context: DocumentSnapshotOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async getLatestSnapshot(
    documentId: string,
  ): Promise<{ yjsSnapshot: Uint8Array; createdAt: Date } | null> {
    try {
      const entity = await this.repository.findOne({
        where: { documentId },
        order: { createdAt: 'DESC' },
      });

      if (!entity) return null;

      return {
        yjsSnapshot: new Uint8Array(entity.yjsSnapshot),
        createdAt: entity.createdAt,
      };
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: collaborationErrorsCodes.COL100,
        context: DocumentSnapshotOrmRepository.name,
        error: error as Error,
      });
    }
  }
}
