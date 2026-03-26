import { Controller, ForbiddenException, Get, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { GetDocumentByIdUseCase } from '../../application';
import { DocumentPresenter } from '../presenters/document.presenter';
import { PermissionProvidersEnum } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class GetDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Get('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string, @AuthUser() authUser: AuthenticatedUserType) {
    const document = await this.getDocumentByIdUseCase.run(id);

    const permission = await this.checkPermission.run(authUser.id, document.folderId);
    if (!permission) {
      throw new ForbiddenException({ code_error: 'PRM001', message: 'Insufficient permissions.' });
    }

    return {
      ...DocumentPresenter.toResponse(document),
      permission_level: permission,
    };
  }
}
