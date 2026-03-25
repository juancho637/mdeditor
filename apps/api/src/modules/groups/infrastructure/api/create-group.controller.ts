import { Body, Controller, ForbiddenException, Inject, Post } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { CreateGroupUseCase } from '../../application';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupPresenter } from '../presenters/group.presenter';

@Controller()
export class CreateGroupController {
  constructor(
    @Inject(GroupProvidersEnum.CREATE_GROUP_USE_CASE)
    private readonly createGroupUseCase: CreateGroupUseCase,
  ) {}

  @Post('api/groups')
  @Auth()
  async run(@Body() dto: CreateGroupDto, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    const group = await this.createGroupUseCase.run(dto.name);
    return GroupPresenter.toResponse(group);
  }
}
