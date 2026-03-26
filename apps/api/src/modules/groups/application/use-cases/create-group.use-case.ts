import { GroupRepositoryInterface, GroupType, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class CreateGroupUseCase {
  private readonly context = CreateGroupUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(name: string): Promise<GroupType> {
    const existing = await this.groupRepository.findByName(name.trim());
    if (existing) {
      throw this.exception.badRequestException({
        message: groupErrorsCodes.GRP002,
        context: this.context,
      });
    }

    return this.groupRepository.create(name.trim());
  }
}
