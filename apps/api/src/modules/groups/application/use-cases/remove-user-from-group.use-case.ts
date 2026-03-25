import { GroupRepositoryInterface, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class RemoveUserFromGroupUseCase {
  private readonly context = RemoveUserFromGroupUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(groupId: string, userId: string): Promise<void> {
    const isMember = await this.groupRepository.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw this.exception.badRequestException({
        message: groupErrorsCodes.GRP004,
        context: this.context,
      });
    }

    await this.groupRepository.removeUser(groupId, userId);
  }
}
