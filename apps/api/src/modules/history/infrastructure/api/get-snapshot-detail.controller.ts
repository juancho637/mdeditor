import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { HistoryProvidersEnum } from '../../domain';
import { GetSnapshotDetailUseCase } from '../../application';
import { SnapshotDetailPresenter } from '../presenters/snapshot-detail.presenter';

@Controller()
export class GetSnapshotDetailController {
  constructor(
    @Inject(HistoryProvidersEnum.GET_SNAPSHOT_DETAIL_USE_CASE)
    private readonly getSnapshotDetailUseCase: GetSnapshotDetailUseCase,
  ) {}

  @Get('api/documents/:documentId/snapshots/:snapshotId')
  @Auth()
  async run(
    @Param('documentId') documentId: string,
    @Param('snapshotId') snapshotId: string,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const snapshot = await this.getSnapshotDetailUseCase.run(documentId, snapshotId, authUser);
    return SnapshotDetailPresenter.toResponse(snapshot);
  }
}
