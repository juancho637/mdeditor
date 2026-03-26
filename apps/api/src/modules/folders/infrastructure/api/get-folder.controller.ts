import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { FolderProvidersEnum } from '../../domain';
import { GetFolderByIdUseCase } from '../../application';
import { FolderPresenter } from '../presenters/folder.presenter';

@Controller()
export class GetFolderController {
  constructor(
    @Inject(FolderProvidersEnum.GET_FOLDER_BY_ID_USE_CASE)
    private readonly getFolderByIdUseCase: GetFolderByIdUseCase,
  ) {}

  @Get('api/folders/:id')
  @Auth()
  async run(@Param('id') id: string) {
    const { folder, path } = await this.getFolderByIdUseCase.run(id);
    return FolderPresenter.toDetailResponse(folder, path);
  }
}
