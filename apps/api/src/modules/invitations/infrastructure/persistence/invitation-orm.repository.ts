import { Repository } from 'typeorm';
import { InvitationEntity } from './invitation.entity';
import {
  InvitationRepositoryInterface,
  InvitationType,
  InvitationStatus,
  invitationErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class InvitationOrmRepository implements InvitationRepositoryInterface {
  constructor(
    private readonly repository: Repository<InvitationEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async create(data: { email: string; token: string; invitedBy: string }): Promise<InvitationType> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: invitationErrorsCodes.INV101,
        context: InvitationOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findByToken(token: string): Promise<InvitationType | null> {
    try {
      const entity = await this.repository.findOne({ where: { token } });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: invitationErrorsCodes.INV100,
        context: InvitationOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findPendingByEmail(email: string): Promise<InvitationType | null> {
    try {
      const entity = await this.repository.findOne({
        where: { email, status: InvitationStatus.PENDING },
      });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: invitationErrorsCodes.INV100,
        context: InvitationOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async findAll(): Promise<InvitationType[]> {
    try {
      const entities = await this.repository.find({ order: { createdAt: 'DESC' } });
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: invitationErrorsCodes.INV100,
        context: InvitationOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async markAccepted(id: string): Promise<void> {
    try {
      await this.repository.update(id, {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: invitationErrorsCodes.INV101,
        context: InvitationOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: InvitationEntity): InvitationType {
    return {
      id: entity.id,
      email: entity.email,
      token: entity.token,
      status: entity.status as InvitationStatus,
      invitedBy: entity.invitedBy,
      createdAt: entity.createdAt,
      acceptedAt: entity.acceptedAt,
    };
  }
}
