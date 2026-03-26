import { Controller, Delete, ForbiddenException, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { RemoveUserFromGroupUseCase } from '../../application';

@Controller()
export class RemoveUserFromGroupController {
  constructor(
    @Inject(GroupProvidersEnum.REMOVE_USER_FROM_GROUP_USE_CASE)
    private readonly removeUserFromGroupUseCase: RemoveUserFromGroupUseCase,
  ) {}

  @Delete('api/groups/:id/users/:userId')
  @Auth()
  async run(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    await this.removeUserFromGroupUseCase.run(groupId, userId);
    return { id: userId };
  }
}
