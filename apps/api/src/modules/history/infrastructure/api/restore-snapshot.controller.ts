import { Controller, Post, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { HistoryProvidersEnum } from '../../domain';
import { RestoreSnapshotUseCase } from '../../application';
import { RestoreSnapshotPresenter } from '../presenters/restore-snapshot.presenter';

@Controller()
export class RestoreSnapshotController {
  constructor(
    @Inject(HistoryProvidersEnum.RESTORE_SNAPSHOT_USE_CASE)
    private readonly restoreSnapshotUseCase: RestoreSnapshotUseCase,
  ) {}

  @Post('api/documents/:documentId/snapshots/:snapshotId/restore')
  @Auth()
  async run(
    @Param('documentId') documentId: string,
    @Param('snapshotId') snapshotId: string,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const result = await this.restoreSnapshotUseCase.run(documentId, snapshotId, authUser);
    return RestoreSnapshotPresenter.toResponse(result);
  }
}
