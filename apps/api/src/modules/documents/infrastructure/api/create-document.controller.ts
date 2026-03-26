import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { CreateDocumentUseCase } from '../../application';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { DocumentPresenter } from '../presenters/document.presenter';

@Controller()
export class CreateDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE)
    private readonly createDocumentUseCase: CreateDocumentUseCase,
  ) {}

  @Post('api/documents')
  @Auth()
  async run(@Body() dto: CreateDocumentDto, @AuthUser() authUser: AuthenticatedUserType) {
    const document = await this.createDocumentUseCase.run({
      title: dto.title,
      folderId: dto.folder_id,
      createdBy: authUser.id,
    });
    return DocumentPresenter.toResponse(document);
  }
}
