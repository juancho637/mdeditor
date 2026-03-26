import { Controller, Delete, Inject, Param } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { FolderProvidersEnum } from '../../domain';
import { DeleteFolderUseCase } from '../../application';

@Controller()
export class DeleteFolderController {
  constructor(
    @Inject(FolderProvidersEnum.DELETE_FOLDER_USE_CASE)
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
  ) {}

  @Delete('api/folders/:id')
  @Auth()
  async run(@Param('id') id: string) {
    await this.deleteFolderUseCase.run(id);
    return { id };
  }
}
