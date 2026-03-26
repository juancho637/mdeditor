import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PermissionLevel } from '../../domain/enums/permission-level.enum';

export class SetPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  folder_id!: string;

  @IsUUID()
  @IsNotEmpty()
  group_id!: string;

  @IsEnum(PermissionLevel)
  @IsNotEmpty()
  permission_level!: PermissionLevel;
}
