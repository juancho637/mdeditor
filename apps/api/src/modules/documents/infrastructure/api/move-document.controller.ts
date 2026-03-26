import { Body, Controller, Inject, Param, Patch } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { DocumentProvidersEnum } from '../../domain';
import { MoveDocumentUseCase } from '../../application';
import { MoveDocumentDto } from '../dto/move-document.dto';
import { DocumentPresenter } from '../presenters/document.presenter';

@Controller()
export class MoveDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.MOVE_DOCUMENT_USE_CASE)
    private readonly moveDocumentUseCase: MoveDocumentUseCase,
  ) {}

  @Patch('api/documents/:id/move')
  @Auth()
  async run(@Param('id') id: string, @Body() dto: MoveDocumentDto) {
    const document = await this.moveDocumentUseCase.run(id, dto.folder_id);
    return DocumentPresenter.toResponse(document);
  }
}
