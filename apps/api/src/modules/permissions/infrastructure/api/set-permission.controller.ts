import { Body, Controller, ForbiddenException, Inject, Put } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { PermissionProvidersEnum, PermissionLevel } from '../../domain';
import { SetPermissionUseCase } from '../../application';
import { SetPermissionDto } from '../dto/set-permission.dto';

@Controller()
export class SetPermissionController {
  constructor(
    @Inject(PermissionProvidersEnum.SET_PERMISSION_USE_CASE)
    private readonly setPermissionUseCase: SetPermissionUseCase,
  ) {}

  @Put('api/permissions')
  @Auth()
  async run(@Body() dto: SetPermissionDto, @AuthUser() authUser: AuthenticatedUserType) {
    if (!authUser.isAdmin) {
      throw new ForbiddenException({ code_error: 'AUT004', message: 'Admin access required.' });
    }

    const permissionLevel = dto.permission_level
      ? (dto.permission_level as PermissionLevel)
      : null;

    const result = await this.setPermissionUseCase.run({
      folderId: dto.folder_id,
      groupId: dto.group_id,
      permissionLevel,
    });

    if (!result) {
      return { deleted: true };
    }

    return {
      id: result.id,
      folder_id: result.folderId,
      group_id: result.groupId,
      permission_level: result.permissionLevel,
      created_at: result.createdAt.toISOString(),
    };
  }
}
