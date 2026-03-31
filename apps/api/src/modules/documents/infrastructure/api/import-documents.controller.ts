import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { DocumentProvidersEnum } from '../../domain';
import { ImportDocumentsUseCase } from '../../application';

@Controller()
export class ImportDocumentsController {
  constructor(
    @Inject(DocumentProvidersEnum.IMPORT_DOCUMENTS_USE_CASE)
    private readonly importDocumentsUseCase: ImportDocumentsUseCase,
  ) {}

  @Post('api/documents/import')
  @Auth()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 1_048_576 },
    }),
  )
  async run(
    @Body('folder_id') folderId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    if (!folderId) {
      throw new BadRequestException({
        code_error: 'DOC400',
        message: 'folder_id is required.',
      });
    }
    if (!files || files.length === 0) {
      throw new BadRequestException({
        code_error: 'DOC400',
        message: 'At least one file is required.',
      });
    }

    return this.importDocumentsUseCase.run({
      userId: authUser.id,
      folderId,
      files: files.map((f) => ({
        originalname: f.originalname,
        buffer: f.buffer,
      })),
    });
  }
}
