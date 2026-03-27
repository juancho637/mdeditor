import { RestoreSnapshotResultType } from '../../domain';

export class RestoreSnapshotPresenter {
  static toResponse(result: RestoreSnapshotResultType) {
    return {
      document_id: result.documentId,
      restored_from_snapshot_id: result.restoredFromSnapshotId,
      new_snapshot_id: result.newSnapshotId,
      message: 'Document restored successfully',
    };
  }
}
