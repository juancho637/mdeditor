import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { DocumentProvidersEnum } from '../../domain';
import { ListDocumentsByFolderUseCase } from '../../application';
import { DocumentPresenter } from '../presenters/document.presenter';

@Controller()
export class ListDocumentsByFolderController {
  constructor(
    @Inject(DocumentProvidersEnum.LIST_DOCUMENTS_BY_FOLDER_USE_CASE)
    private readonly listDocumentsByFolderUseCase: ListDocumentsByFolderUseCase,
  ) {}

  @Get('api/folders/:folderId/documents')
  @Auth()
  async run(@Param('folderId') folderId: string) {
    const documents = await this.listDocumentsByFolderUseCase.run(folderId);
    return documents.map((d) => DocumentPresenter.toSummaryResponse(d));
  }
}
