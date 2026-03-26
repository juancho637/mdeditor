import { Controller, Delete, ForbiddenException, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { PermissionProvidersEnum, permissionErrorsCodes } from '../../domain';
import { PermissionRepositoryInterface } from '../../domain';
import { ExceptionServiceInterface, ExceptionProvidersEnum } from '@common/exception/domain';

@Controller()
export class DeletePermissionController {
  constructor(
    @Inject(PermissionProvidersEnum.PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryInterface,
    @Inject(ExceptionProvidersEnum.EXCEPTION_SERVICE)
    private readonly exception: ExceptionServiceInterface,
  ) {}

  @Delete('api/permissions/:id')
  @Auth()
  async run(@Param('id') id: string, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw this.exception.notFoundException({
        message: permissionErrorsCodes.PRM001,
        context: DeletePermissionController.name,
      });
    }

    await this.permissionRepository.delete(id);
    return { id };
  }
}
