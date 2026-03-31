import { Repository } from 'typeorm';
import { DocumentShareEntity } from './document-share.entity';
import {
  DocumentShareRepositoryInterface,
  DocumentShareType,
  documentErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DocumentShareOrmRepository
  implements DocumentShareRepositoryInterface
{
  constructor(
    private readonly repository: Repository<DocumentShareEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(data: {
    documentId: string;
    shareToken: string;
    createdBy: string;
  }): Promise<DocumentShareType> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC101,
        context: DocumentShareOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByDocumentId(
    documentId: string,
  ): Promise<DocumentShareType | null> {
    try {
      const entity = await this.repository.findOne({ where: { documentId } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC100,
        context: DocumentShareOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByToken(token: string): Promise<DocumentShareType | null> {
    try {
      const entity = await this.repository.findOne({
        where: { shareToken: token },
      });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC100,
        context: DocumentShareOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      await this.repository.delete({ documentId });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC101,
        context: DocumentShareOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: DocumentShareEntity): DocumentShareType {
    return {
      id: entity.id,
      documentId: entity.documentId,
      shareToken: entity.shareToken,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    };
  }
}
