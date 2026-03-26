import { ILike, Repository } from 'typeorm';
import { FolderEntity } from './folder.entity';
import {
  FolderRepositoryInterface,
  FolderType,
  folderErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class FolderOrmRepository implements FolderRepositoryInterface {
  constructor(
    private readonly repository: Repository<FolderEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(data: { name: string; slug: string; parentId: string | null; createdBy: string }): Promise<FolderType> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD101,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findById(id: string): Promise<FolderType | null> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD100,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByNameInParent(name: string, parentId: string | null): Promise<FolderType | null> {
    try {
      const entity = await this.repository.findOne({
        where: { name: ILike(name), parentId: parentId ?? undefined as any },
      });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD100,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findAll(): Promise<FolderType[]> {
    try {
      const entities = await this.repository.find({ order: { name: 'ASC' } });
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD100,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async update(id: string, data: { name: string; slug: string }): Promise<FolderType> {
    try {
      await this.repository.update(id, data);
      const entity = await this.repository.findOneOrFail({ where: { id } });
      return this.toDomain(entity);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD101,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD101,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async getPath(id: string): Promise<FolderType[]> {
    try {
      const path: FolderType[] = [];
      let current = await this.repository.findOne({ where: { id } });
      while (current) {
        path.unshift(this.toDomain(current));
        current = current.parentId
          ? await this.repository.findOne({ where: { id: current.parentId } })
          : null;
      }
      return path;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: folderErrorsCodes.FLD100,
        context: FolderOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: FolderEntity): FolderType {
    return {
      id: entity.id,
      parentId: entity.parentId,
      name: entity.name,
      slug: entity.slug,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
