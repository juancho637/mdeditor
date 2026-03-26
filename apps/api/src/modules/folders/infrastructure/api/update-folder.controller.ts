import { Body, Controller, Inject, Param, Put } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { FolderProvidersEnum } from '../../domain';
import { UpdateFolderUseCase } from '../../application';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import { FolderPresenter } from '../presenters/folder.presenter';

@Controller()
export class UpdateFolderController {
  constructor(
    @Inject(FolderProvidersEnum.UPDATE_FOLDER_USE_CASE)
    private readonly updateFolderUseCase: UpdateFolderUseCase,
  ) {}

  @Put('api/folders/:id')
  @Auth()
  async run(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    const folder = await this.updateFolderUseCase.run(id, dto.name);
    return FolderPresenter.toResponse(folder);
  }
}
