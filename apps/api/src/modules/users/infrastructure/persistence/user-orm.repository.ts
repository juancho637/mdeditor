import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRepositoryInterface, UserType, usersErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class UserOrmRepository implements UserRepositoryInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async findByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await this.repository.findOne({ where: { email } });
      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: usersErrorsCodes.USR100,
        context: UserOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findById(id: string): Promise<UserType | null> {
    try {
      const user = await this.repository.findOne({ where: { id } });
      return user ? this.toDomain(user) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: usersErrorsCodes.USR100,
        context: UserOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
  }): Promise<UserType> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: usersErrorsCodes.USR101,
        context: UserOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async count(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: usersErrorsCodes.USR100,
        context: UserOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: UserEntity): UserType {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      isAdmin: entity.isAdmin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
