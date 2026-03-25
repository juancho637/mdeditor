import { Controller, ForbiddenException, Get, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { GetGroupByIdUseCase } from '../../application';
import { GroupPresenter } from '../presenters/group.presenter';

@Controller()
export class GetGroupController {
  constructor(
    @Inject(GroupProvidersEnum.GET_GROUP_BY_ID_USE_CASE)
    private readonly getGroupByIdUseCase: GetGroupByIdUseCase,
  ) {}

  @Get('api/groups/:id')
  @Auth()
  async run(@Param('id') id: string, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    const group = await this.getGroupByIdUseCase.run(id);
    return GroupPresenter.toDetailResponse(group);
  }
}
