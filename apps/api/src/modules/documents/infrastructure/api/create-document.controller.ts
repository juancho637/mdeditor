import { Body, Controller, ForbiddenException, Inject, Post } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { CreateDocumentUseCase } from '../../application';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { DocumentPresenter } from '../presenters/document.presenter';
import { PermissionProvidersEnum, PermissionLevel } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class CreateDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE)
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Post('api/documents')
  @Auth()
  async run(@Body() dto: CreateDocumentDto, @AuthUser() authUser: AuthenticatedUserType) {
    const permission = await this.checkPermission.run(authUser.id, dto.folder_id);
    if (permission !== PermissionLevel.EDIT) {
      throw new ForbiddenException({ code_error: 'PRM001', message: 'Insufficient permissions.' });
    }

    const document = await this.createDocumentUseCase.run({
      title: dto.title,
      folderId: dto.folder_id,
      createdBy: authUser.id,
    });
    return DocumentPresenter.toResponse(document);
  }
}
