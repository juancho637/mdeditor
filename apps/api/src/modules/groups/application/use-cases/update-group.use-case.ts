import { GroupRepositoryInterface, GroupType, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class UpdateGroupUseCase {
  private readonly context = UpdateGroupUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string, name: string): Promise<GroupType> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP001,
        context: this.context,
      });
    }

    const trimmedName = name.trim();
    const existing = await this.groupRepository.findByName(trimmedName);
    if (existing && existing.id !== id) {
      throw this.exception.badRequestException({
        message: groupErrorsCodes.GRP002,
        context: this.context,
      });
    }

    return this.groupRepository.update(id, trimmedName);
  }
}
