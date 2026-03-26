import { Body, Controller, ForbiddenException, Inject, Param, Post } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { AddUserToGroupUseCase } from '../../application';
import { AddUserToGroupDto } from '../dto/add-user-to-group.dto';

@Controller()
export class AddUserToGroupController {
  constructor(
    @Inject(GroupProvidersEnum.ADD_USER_TO_GROUP_USE_CASE)
    private readonly addUserToGroupUseCase: AddUserToGroupUseCase,
  ) {}

  @Post('api/groups/:id/users')
  @Auth()
  async run(
    @Param('id') groupId: string,
    @Body() dto: AddUserToGroupDto,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    await this.addUserToGroupUseCase.run(groupId, dto.user_id);
    return { user_id: dto.user_id, group_id: groupId };
  }
}
