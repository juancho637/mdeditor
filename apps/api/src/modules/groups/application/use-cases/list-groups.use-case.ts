import { GroupRepositoryInterface, GroupType } from '../../domain';

export class ListGroupsUseCase {
  constructor(private readonly groupRepository: GroupRepositoryInterface) {}

  async run(): Promise<GroupType[]> {
    return this.groupRepository.findAll();
  }
}
