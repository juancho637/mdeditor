import { Controller, Delete, ForbiddenException, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { DeleteDocumentUseCase, GetDocumentByIdUseCase } from '../../application';
import { PermissionProvidersEnum, PermissionLevel } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class DeleteDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.DELETE_DOCUMENT_USE_CASE)
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Delete('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string, @AuthUser() authUser: AuthenticatedUserType) {
    const document = await this.getDocumentByIdUseCase.run(id);
    const permission = await this.checkPermission.run(authUser.id, document.folderId);
    if (permission !== PermissionLevel.EDIT) {
      throw new ForbiddenException({ code_error: 'PRM001', message: 'Insufficient permissions.' });
    }

    await this.deleteDocumentUseCase.run(id);
    return { id };
  }
}
