import { Controller, ForbiddenException, Get, Inject } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { ListGroupsUseCase } from '../../application';
import { GroupPresenter } from '../presenters/group.presenter';

@Controller()
export class ListGroupsController {
  constructor(
    @Inject(GroupProvidersEnum.LIST_GROUPS_USE_CASE)
    private readonly listGroupsUseCase: ListGroupsUseCase,
  ) {}

  @Get('api/groups')
  @Auth()
  async run(@AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    const groups = await this.listGroupsUseCase.run();
    return groups.map((g) => GroupPresenter.toResponse(g));
  }
}
