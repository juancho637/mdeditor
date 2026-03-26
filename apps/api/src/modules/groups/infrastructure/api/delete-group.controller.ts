import { Controller, Delete, ForbiddenException, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { GroupProvidersEnum } from '../../domain';
import { DeleteGroupUseCase } from '../../application';

@Controller()
export class DeleteGroupController {
  constructor(
    @Inject(GroupProvidersEnum.DELETE_GROUP_USE_CASE)
    private readonly deleteGroupUseCase: DeleteGroupUseCase,
  ) {}

  @Delete('api/groups/:id')
  @Auth()
  async run(@Param('id') id: string, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }
    await this.deleteGroupUseCase.run(id);
    return { id };
  }
}
