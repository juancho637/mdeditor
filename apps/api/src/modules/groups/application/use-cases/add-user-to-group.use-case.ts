import { UserRepositoryInterface } from '@modules/users/domain';
import { GroupRepositoryInterface, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class AddUserToGroupUseCase {
  private readonly context = AddUserToGroupUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP001,
        context: this.context,
      });
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP005,
        context: this.context,
      });
    }

    const alreadyMember = await this.groupRepository.isUserInGroup(groupId, userId);
    if (alreadyMember) {
      throw this.exception.badRequestException({
        message: groupErrorsCodes.GRP003,
        context: this.context,
      });
    }

    await this.groupRepository.addUser(groupId, userId);
  }
}
