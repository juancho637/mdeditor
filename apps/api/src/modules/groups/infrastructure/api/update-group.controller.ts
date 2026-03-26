import { Body, Controller, ForbiddenException, Inject, Param, Put } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { UpdateGroupUseCase } from '../../application';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { GroupPresenter } from '../presenters/group.presenter';

@Controller()
export class UpdateGroupController {
  constructor(
    @Inject(GroupProvidersEnum.UPDATE_GROUP_USE_CASE)
    private readonly updateGroupUseCase: UpdateGroupUseCase,
  ) {}

  @Put('api/groups/:id')
  @Auth()
  async run(@Param('id') id: string, @Body() dto: UpdateGroupDto, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    const group = await this.updateGroupUseCase.run(id, dto.name);
    return GroupPresenter.toResponse(group);
  }
}
