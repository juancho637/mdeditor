import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { DocumentProvidersEnum } from '../../domain';
import { GetDocumentByIdUseCase } from '../../application';
import { DocumentPresenter } from '../presenters/document.presenter';

@Controller()
export class GetDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_ID_USE_CASE)
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
  ) {}

  @Get('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string) {
    const document = await this.getDocumentByIdUseCase.run(id);
    return DocumentPresenter.toResponse(document);
  }
}
