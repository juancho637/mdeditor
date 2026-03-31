import {
  Controller,
  ForbiddenException,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import {
  CreateDocumentShareUseCase,
  GetDocumentByIdUseCase,
} from '../../application';
import { DocumentSharePresenter } from '../presenters/document-share.presenter';
import {
  PermissionProvidersEnum,
  PermissionLevel,
} from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class CreateDocumentShareController {
  constructor(
    @Inject(DocumentProvidersEnum.CREATE_DOCUMENT_SHARE_USE_CASE)
    private readonly createDocumentShare: CreateDocumentShareUseCase,
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentById: GetDocumentByIdUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Post('api/documents/:id/share')
  @Auth()
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

    const share = await this.createDocumentShare.run(id, authUser.id);
    return DocumentSharePresenter.toResponse(share);
  }
}
