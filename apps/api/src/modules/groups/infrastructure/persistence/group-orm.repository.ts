import { Repository } from 'typeorm';
import { GroupEntity } from './group.entity';
import { UserGroupEntity } from './user-group.entity';
import { UserEntity } from '@modules/users/infrastructure/persistence/user.entity';
import {
  GroupRepositoryInterface,
  GroupType,
  GroupWithMembersType,
  groupErrorsCodes,
} from '../../domain';
import { UserType } from '@modules/users/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GroupOrmRepository implements GroupRepositoryInterface {
  constructor(
    private readonly groupRepo: Repository<GroupEntity>,
    private readonly userGroupRepo: Repository<UserGroupEntity>,
    private readonly userRepo: Repository<UserEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(name: string): Promise<GroupType> {
    try {
      const entity = this.groupRepo.create({ name });
      const saved = await this.groupRepo.save(entity);
      return this.toDomain(saved, 0);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP101,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findById(id: string): Promise<GroupType | null> {
    try {
      const entity = await this.groupRepo.findOne({ where: { id } });
      if (!entity) return null;
      const count = await this.userGroupRepo.count({ where: { groupId: id } });
      return this.toDomain(entity, count);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByIdWithMembers(id: string): Promise<GroupWithMembersType | null> {
    try {
      const entity = await this.groupRepo.findOne({ where: { id } });
      if (!entity) return null;
      const members = await this.findMembers(id);
      return {
        id: entity.id,
        name: entity.name,
        createdAt: entity.createdAt,
        members,
      };
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByName(name: string): Promise<GroupType | null> {
    try {
      const entity = await this.groupRepo
        .createQueryBuilder('g')
        .where('LOWER(g.name) = LOWER(:name)', { name })
        .getOne();
      if (!entity) return null;
      const count = await this.userGroupRepo.count({ where: { groupId: entity.id } });
      return this.toDomain(entity, count);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findAll(): Promise<GroupType[]> {
    try {
      const entities = await this.groupRepo.find({ order: { name: 'ASC' } });
      const result: GroupType[] = [];
      for (const entity of entities) {
        const count = await this.userGroupRepo.count({ where: { groupId: entity.id } });
        result.push(this.toDomain(entity, count));
      }
      return result;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async update(id: string, name: string): Promise<GroupType> {
    try {
      await this.groupRepo.update(id, { name });
      const entity = await this.groupRepo.findOneOrFail({ where: { id } });
      const count = await this.userGroupRepo.count({ where: { groupId: id } });
      return this.toDomain(entity, count);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP101,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.groupRepo.delete(id);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP101,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async addUser(groupId: string, userId: string): Promise<void> {
    try {
      const entity = this.userGroupRepo.create({ groupId, userId });
      await this.userGroupRepo.save(entity);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP101,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async removeUser(groupId: string, userId: string): Promise<void> {
    try {
      await this.userGroupRepo.delete({ groupId, userId });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP101,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.userGroupRepo.count({ where: { groupId, userId } });
      return count > 0;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findMembers(groupId: string): Promise<UserType[]> {
    try {
      const memberships = await this.userGroupRepo.find({ where: { groupId } });
      const userIds = memberships.map((m) => m.userId);
      if (userIds.length === 0) return [];
      const users = await this.userRepo
        .createQueryBuilder('u')
        .whereInIds(userIds)
        .getMany();
      return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: groupErrorsCodes.GRP100,
        context: GroupOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: GroupEntity, memberCount: number): GroupType {
    return {
      id: entity.id,
      name: entity.name,
      memberCount,
      createdAt: entity.createdAt,
    };
  }
}
