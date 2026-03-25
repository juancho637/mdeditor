import { GroupRepositoryInterface, groupErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DeleteGroupUseCase {
  private readonly context = DeleteGroupUseCase.name;

  constructor(
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<void> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP001,
        context: this.context,
      });
    }

    await this.groupRepository.delete(id);
  }
}
