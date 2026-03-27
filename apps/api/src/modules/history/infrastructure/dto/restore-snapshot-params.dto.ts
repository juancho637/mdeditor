import { IsUUID } from 'class-validator';

export class RestoreSnapshotParamsDto {
  @IsUUID()
  documentId!: string;

  @IsUUID()
  snapshotId!: string;
}
