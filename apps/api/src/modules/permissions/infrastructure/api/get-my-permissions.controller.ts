import { Controller, Get, Inject } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { PermissionProvidersEnum } from '../../domain';
import { GetUserPermissionsUseCase } from '../../application';

@Controller()
export class GetMyPermissionsController {
  constructor(
    @Inject(PermissionProvidersEnum.GET_USER_PERMISSIONS_USE_CASE)
    private readonly getUserPermissionsUseCase: GetUserPermissionsUseCase,
  ) {}

  @Get('api/permissions/me')
  @Auth()
  async run(@AuthUser() authUser: AuthenticatedUserType) {
    return this.getUserPermissionsUseCase.run(authUser.id);
  }
}
