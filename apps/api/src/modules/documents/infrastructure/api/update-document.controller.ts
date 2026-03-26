import { Body, Controller, ForbiddenException, Inject, Param, Put } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { GetDocumentByIdUseCase, UpdateDocumentUseCase } from '../../application';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentPresenter } from '../presenters/document.presenter';
import { PermissionProvidersEnum, PermissionLevel } from '@modules/permissions/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

@Controller()
export class UpdateDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.UPDATE_DOCUMENT_USE_CASE)
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    @Inject(PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE)
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  @Put('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @AuthUser() authUser: AuthenticatedUserType) {
    const existing = await this.getDocumentByIdUseCase.run(id);
    const permission = await this.checkPermission.run(authUser.id, existing.folderId);
    if (permission !== PermissionLevel.EDIT) {
      throw new ForbiddenException({ code_error: 'PRM001', message: 'Insufficient permissions.' });
    }

    const document = await this.updateDocumentUseCase.run(id, {
      title: dto.title,
      contentMarkdown: dto.content_markdown,
    });
    return DocumentPresenter.toResponse(document);
  }
}
