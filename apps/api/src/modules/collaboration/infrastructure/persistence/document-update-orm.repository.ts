import { Repository } from 'typeorm';
import { DocumentUpdateEntity } from '@modules/documents/infrastructure/persistence/document-update.entity';
import { DocumentUpdateRepositoryInterface, collaborationErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DocumentUpdateOrmRepository implements DocumentUpdateRepositoryInterface {
  constructor(
    private readonly repository: Repository<DocumentUpdateEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async saveUpdate(documentId: string, update: Uint8Array, authorId: string): Promise<void> {
    try {
      const entity = this.repository.create({
        documentId,
        yjsUpdate: Buffer.from(update),
        authorId,
      });
      await this.repository.save(entity);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: collaborationErrorsCodes.COL100,
        context: DocumentUpdateOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async getUpdatesSince(documentId: string, since: Date): Promise<Uint8Array[]> {
    try {
      const entities = await this.repository
        .createQueryBuilder('update')
        .where('update.document_id = :documentId', { documentId })
        .andWhere('update.created_at > :since', { since })
        .orderBy('update.created_at', 'ASC')
        .getMany();

      return entities.map((e) => new Uint8Array(e.yjsUpdate));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: collaborationErrorsCodes.COL100,
        context: DocumentUpdateOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async deleteBeforeDate(documentId: string, before: Date): Promise<void> {
    try {
      await this.repository
        .createQueryBuilder()
        .delete()
        .where('document_id = :documentId', { documentId })
        .andWhere('created_at <= :before', { before })
        .execute();
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: collaborationErrorsCodes.COL100,
        context: DocumentUpdateOrmRepository.name,
        error: error as Error,
      });
    }
  }
}
