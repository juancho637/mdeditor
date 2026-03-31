import {
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Inject,
  Param,
} from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import {
  DeleteDocumentShareUseCase,
  GetDocumentByIdUseCase,
} from '../../application';
import {
  PermissionProvidersEnum,
  PermissionLevel,
} from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class DeleteDocumentShareController {
  constructor(
    @Inject(DocumentProvidersEnum.DELETE_DOCUMENT_SHARE_USE_CASE)
    private readonly deleteDocumentShare: DeleteDocumentShareUseCase,
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentById: GetDocumentByIdUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Delete('api/documents/:id/share')
  @Auth()
  @HttpCode(204)
  async run(
    @Param('id') id: string,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const doc = await this.getDocumentById.run(id);
    const permission = await this.checkPermission.run(
      authUser.id,
      doc.folderId,
    );
    if (permission !== PermissionLevel.EDIT) {
      throw new ForbiddenException({
        code_error: 'PRM001',
        message: 'Insufficient permissions.',
      });
    }

    await this.deleteDocumentShare.run(id);
  }
}
