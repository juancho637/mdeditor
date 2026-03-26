import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { FolderProvidersEnum } from '../../domain';
import { CreateFolderUseCase } from '../../application';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { FolderPresenter } from '../presenters/folder.presenter';

@Controller()
export class CreateFolderController {
  constructor(
    @Inject(FolderProvidersEnum.CREATE_FOLDER_USE_CASE)
    private readonly createFolderUseCase: CreateFolderUseCase,
  ) {}

  @Post('api/folders')
  @Auth()
  async run(@Body() dto: CreateFolderDto, @AuthUser() authUser: AuthenticatedUserType) {
    const folder = await this.createFolderUseCase.run({
      name: dto.name,
      parentId: dto.parent_id ?? null,
      createdBy: authUser.id,
    });
    return FolderPresenter.toResponse(folder);
  }
}
