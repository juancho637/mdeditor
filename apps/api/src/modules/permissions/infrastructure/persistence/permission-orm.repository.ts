import { Repository } from 'typeorm';
import { FolderPermissionEntity } from './folder-permission.entity';
import {
  PermissionRepositoryInterface,
  FolderPermissionType,
  PermissionLevel,
  permissionErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class PermissionOrmRepository implements PermissionRepositoryInterface {
  constructor(
    private readonly repository: Repository<FolderPermissionEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async findByFolderAndGroup(folderId: string, groupId: string): Promise<FolderPermissionType | null> {
    try {
      const entity = await this.repository.findOne({ where: { folderId, groupId } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM100,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findAll(): Promise<FolderPermissionType[]> {
    try {
      const entities = await this.repository.find();
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM100,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByFolderId(folderId: string): Promise<FolderPermissionType[]> {
    try {
      const entities = await this.repository.find({ where: { folderId } });
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM100,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findById(id: string): Promise<FolderPermissionType | null> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM100,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async upsert(folderId: string, groupId: string, permissionLevel: PermissionLevel): Promise<FolderPermissionType> {
    try {
      const existing = await this.repository.findOne({ where: { folderId, groupId } });

      if (existing) {
        existing.permissionLevel = permissionLevel;
        const saved = await this.repository.save(existing);
        return this.toDomain(saved);
      }

      const entity = this.repository.create({ folderId, groupId, permissionLevel });
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM101,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM101,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async deleteByFolderAndGroup(folderId: string, groupId: string): Promise<void> {
    try {
      await this.repository.delete({ folderId, groupId });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: permissionErrorsCodes.PRM101,
        context: PermissionOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: FolderPermissionEntity): FolderPermissionType {
    return {
      id: entity.id,
      folderId: entity.folderId,
      groupId: entity.groupId,
      permissionLevel: entity.permissionLevel as PermissionLevel,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
