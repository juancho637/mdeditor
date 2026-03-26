import { Controller, Delete, Inject, Param } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { DocumentProvidersEnum } from '../../domain';
import { DeleteDocumentUseCase } from '../../application';

@Controller()
export class DeleteDocumentController {
  constructor(
    @Inject(DocumentProvidersEnum.DELETE_DOCUMENT_USE_CASE)
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  @Delete('api/documents/:id')
  @Auth()
  async run(@Param('id') id: string) {
    await this.deleteDocumentUseCase.run(id);
    return { id };
  }
}
