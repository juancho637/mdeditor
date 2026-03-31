import { Controller, Get, Inject, Param } from '@nestjs/common';
import { DocumentProvidersEnum } from '../../domain';
import { GetDocumentByShareTokenUseCase } from '../../application';
import { PublicDocumentPresenter } from '../presenters/public-document.presenter';

@Controller()
export class GetPublicDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.GET_DOCUMENT_BY_SHARE_TOKEN_USE_CASE)
    private readonly getDocumentByShareToken: GetDocumentByShareTokenUseCase,
  ) {}

  @Get('api/public/documents/:token')
  async run(@Param('token') token: string) {
    const doc = await this.getDocumentByShareToken.run(token);
    return PublicDocumentPresenter.toResponse(doc);
  }
}
