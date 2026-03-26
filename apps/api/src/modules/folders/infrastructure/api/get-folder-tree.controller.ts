import { Controller, Get, Inject } from '@nestjs/common';
import { Auth } from '@common/helpers/infrastructure';
import { FolderProvidersEnum } from '../../domain';
import { GetFolderTreeUseCase } from '../../application';
import { FolderPresenter } from '../presenters/folder.presenter';

@Controller()
export class GetFolderTreeController {
  constructor(
    @Inject(FolderProvidersEnum.GET_FOLDER_TREE_USE_CASE)
    private readonly getFolderTreeUseCase: GetFolderTreeUseCase,
  ) {}

  @Get('api/folders/tree')
  @Auth()
  async run() {
    const tree = await this.getFolderTreeUseCase.run();
    return FolderPresenter.toTreeResponse(tree);
  }
}
