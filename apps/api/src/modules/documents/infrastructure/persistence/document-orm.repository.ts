import { Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';
import {
  DocumentRepositoryInterface,
  DocumentType,
  DocumentSummaryType,
  documentErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DocumentOrmRepository implements DocumentRepositoryInterface {
  constructor(
    private readonly repository: Repository<DocumentEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(data: { folderId: string; title: string; slug: string; createdBy: string }): Promise<DocumentType> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC101,
        context: DocumentOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findById(id: string): Promise<DocumentType | null> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC100,
        context: DocumentOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByFolderId(folderId: string): Promise<DocumentSummaryType[]> {
    try {
      const entities = await this.repository.find({
        where: { folderId },
        order: { title: 'ASC' },
      });
      return entities.map((e) => ({
        id: e.id,
        folderId: e.folderId,
        title: e.title,
        slug: e.slug,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC100,
        context: DocumentOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async update(id: string, data: { title?: string; slug?: string; contentMarkdown?: string; folderId?: string }): Promise<DocumentType> {
    try {
      await this.repository.update(id, data);
      const entity = await this.repository.findOneOrFail({ where: { id } });
      return this.toDomain(entity);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC101,
        context: DocumentOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC101,
        context: DocumentOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: DocumentEntity): DocumentType {
    return {
      id: entity.id,
      folderId: entity.folderId,
      title: entity.title,
      slug: entity.slug,
      contentMarkdown: entity.contentMarkdown,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
