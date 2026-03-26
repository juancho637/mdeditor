import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class SetPermissionDto {
  @IsUUID()
  @IsNotEmpty()
  folder_id!: string;

  @IsUUID()
  @IsNotEmpty()
  group_id!: string;

  @IsEnum(['view', 'edit'], { message: 'permission_level must be view, edit, or null' })
  @IsOptional()
  permission_level?: 'view' | 'edit' | null;
}
