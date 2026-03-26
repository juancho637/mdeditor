import { GroupRepositoryInterface, GroupWithMembersType, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GetGroupByIdUseCase {
  private readonly context = GetGroupByIdUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<GroupWithMembersType> {
    const group = await this.groupRepository.findByIdWithMembers(id);
    if (!group) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP001,
        context: this.context,
      });
    }
    return group;
  }
}
