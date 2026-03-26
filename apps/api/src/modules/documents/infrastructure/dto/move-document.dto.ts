import { IsNotEmpty, IsUUID } from 'class-validator';

export class MoveDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  folder_id!: string;
}
