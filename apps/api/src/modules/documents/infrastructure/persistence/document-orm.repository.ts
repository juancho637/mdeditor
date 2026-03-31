import { Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';
import {
  DocumentRepositoryInterface,
  DocumentType,
  DocumentSummaryType,
  SearchResultType,
  documentErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DocumentOrmRepository implements DocumentRepositoryInterface {
  constructor(
    private readonly repository: Repository<DocumentEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(data: {
    folderId: string;
    title: string;
    slug: string;
    createdBy: string;
  }): Promise<DocumentType> {
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

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      contentMarkdown?: string;
      folderId?: string;
      yjsState?: Buffer;
    },
  ): Promise<DocumentType> {
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

  async search(userId: string, query: string): Promise<SearchResultType[]> {
    try {
      const rows: Array<{
        id: string;
        folder_id: string;
        folder_name: string;
        title: string;
        slug: string;
        preview: string;
      }> = await this.repository.manager.query(
        `
        SELECT
          d.id,
          d.folder_id,
          f.name AS folder_name,
          d.title,
          d.slug,
          ts_headline(
            'simple',
            regexp_replace(d.content_markdown, '<[^>]+>', ' ', 'g'),
            websearch_to_tsquery('simple', $1),
            'MaxWords=20, MinWords=5, StartSel=<b>, StopSel=</b>, HighlightAll=FALSE'
          ) AS preview
        FROM documents d
        JOIN folders f ON d.folder_id = f.id
        WHERE d.search_vector @@ websearch_to_tsquery('simple', $1)
          AND (
            EXISTS (SELECT 1 FROM users WHERE id = $2 AND is_admin = true)
            OR d.folder_id IN (
              SELECT fp.folder_id
              FROM folder_permissions fp
              JOIN user_groups ug ON fp.group_id = ug.group_id
              WHERE ug.user_id = $2
            )
          )
        ORDER BY ts_rank(d.search_vector, websearch_to_tsquery('simple', $1)) DESC
        LIMIT 20
        `,
        [query, userId],
      );

      return rows.map((row) => ({
        id: row.id,
        folderId: row.folder_id,
        folderName: row.folder_name,
        title: row.title,
        slug: row.slug,
        preview: row.preview ?? '',
      }));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: documentErrorsCodes.DOC100,
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
      yjsState: entity.yjsState,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
