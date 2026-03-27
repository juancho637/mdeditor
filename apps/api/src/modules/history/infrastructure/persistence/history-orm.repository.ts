import { Repository } from 'typeorm';
import { DocumentSnapshotEntity } from '@modules/documents/infrastructure/persistence/document-snapshot.entity';
import { HistoryRepositoryInterface, SnapshotSummaryType, SnapshotDetailType, historyErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class HistoryOrmRepository implements HistoryRepositoryInterface {
  constructor(
    private readonly repository: Repository<DocumentSnapshotEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async findSnapshotsByDocumentId(
    documentId: string,
    page: number,
    limit: number,
  ): Promise<{ snapshots: SnapshotSummaryType[]; total: number }> {
    try {
      const [entities, total] = await this.repository
        .createQueryBuilder('snapshot')
        .leftJoin('users', 'author', 'author.id = snapshot.author_id')
        .select([
          'snapshot.id AS id',
          'snapshot.document_id AS "documentId"',
          'snapshot.author_id AS "authorId"',
          'author.name AS "authorName"',
          'snapshot.created_at AS "createdAt"',
        ])
        .where('snapshot.document_id = :documentId', { documentId })
        .orderBy('snapshot.created_at', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany()
        .then(async (rows) => {
          const countResult = await this.repository.count({ where: { documentId } });
          return [rows, countResult] as const;
        });

      return {
        snapshots: entities.map((row) => ({
          id: row.id,
          documentId: row.documentId,
          authorId: row.authorId,
          authorName: row.authorName ?? null,
          createdAt: row.createdAt,
        })),
        total,
      };
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: historyErrorsCodes.HST100,
        context: HistoryOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findSnapshotById(snapshotId: string): Promise<SnapshotDetailType | null> {
    try {
      const row = await this.repository
        .createQueryBuilder('snapshot')
        .leftJoin('users', 'author', 'author.id = snapshot.author_id')
        .select([
          'snapshot.id AS id',
          'snapshot.document_id AS "documentId"',
          'snapshot.author_id AS "authorId"',
          'author.name AS "authorName"',
          'snapshot.content_markdown AS "contentMarkdown"',
          'snapshot.created_at AS "createdAt"',
        ])
        .where('snapshot.id = :snapshotId', { snapshotId })
        .getRawOne();

      if (!row) return null;

      return {
        id: row.id,
        documentId: row.documentId,
        authorId: row.authorId,
        authorName: row.authorName ?? null,
        contentMarkdown: row.contentMarkdown,
        createdAt: row.createdAt,
      };
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: historyErrorsCodes.HST100,
        context: HistoryOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async saveSnapshot(
    documentId: string,
    yjsSnapshot: Buffer,
    contentMarkdown: string,
    authorId: string,
  ): Promise<string> {
    try {
      const entity = this.repository.create({
        documentId,
        yjsSnapshot,
        contentMarkdown,
        authorId,
      });
      const saved = await this.repository.save(entity);
      return saved.id;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: historyErrorsCodes.HST100,
        context: HistoryOrmRepository.name,
        error: error as Error,
      });
    }
  }
}
