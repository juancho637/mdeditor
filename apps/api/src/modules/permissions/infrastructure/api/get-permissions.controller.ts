import { Controller, ForbiddenException, Get, Inject } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { PermissionProvidersEnum } from '../../domain';
import { GetPermissionMatrixUseCase } from '../../application';

@Controller()
export class GetPermissionsController {
  constructor(
    @Inject(PermissionProvidersEnum.GET_PERMISSION_MATRIX_USE_CASE)
    private readonly getPermissionMatrixUseCase: GetPermissionMatrixUseCase,
  ) {}

  @Get('api/permissions')
  @Auth()
  async run(@AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }

    const permissions = await this.getPermissionMatrixUseCase.run();
    return permissions.map((p) => ({
      id: p.id,
      folder_id: p.folderId,
      group_id: p.groupId,
      permission_level: p.permissionLevel,
    }));
  }
}
