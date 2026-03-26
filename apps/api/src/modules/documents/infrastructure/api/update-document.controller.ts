import { Body, Controller, Inject, Param, Put } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { DocumentProvidersEnum } from '../../domain';
import { UpdateDocumentUseCase } from '../../application';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentPresenter } from '../presenters/document.presenter';

@Controller()
export class UpdateDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.UPDATE_DOCUMENT_USE_CASE)
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
  ) {}

  @Put('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    const document = await this.updateDocumentUseCase.run(id, {
      title: dto.title,
      contentMarkdown: dto.content_markdown,
    });
    return DocumentPresenter.toResponse(document);
  }
}
