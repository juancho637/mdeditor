import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddUserToGroupDto {
  @IsUUID()
  @IsNotEmpty()
  user_id!: string;
}
