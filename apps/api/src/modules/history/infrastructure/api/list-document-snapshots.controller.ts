import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { Auth, AuthUser } from '@common/helpers/infrastructure';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { HistoryProvidersEnum } from '../../domain';
import { ListDocumentSnapshotsUseCase } from '../../application';
import { ListSnapshotsQueryDto } from '../dto/list-snapshots-query.dto';
import { SnapshotSummaryPresenter } from '../presenters/snapshot-summary.presenter';

@Controller()
export class ListDocumentSnapshotsController {
  constructor(
    @Inject(HistoryProvidersEnum.LIST_DOCUMENT_SNAPSHOTS_USE_CASE)
    private readonly listDocumentSnapshotsUseCase: ListDocumentSnapshotsUseCase,
  ) {}

  @Get('api/documents/:documentId/snapshots')
  @Auth()
  async run(
    @Param('documentId') documentId: string,
    @Query() query: ListSnapshotsQueryDto,
    @AuthUser() authUser: AuthenticatedUserType,
  ) {
    const result = await this.listDocumentSnapshotsUseCase.run(
      documentId,
      query.page ?? 1,
      query.limit ?? 20,
      authUser,
    );

    return {
      snapshots: result.snapshots.map(SnapshotSummaryPresenter.toResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
