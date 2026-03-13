import { IsString, Length } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/strong-password.validator.js';

export class ChangePasswordDto {
  @IsString()
  @Length(1, 128)
  currentPassword!: string;

  @IsStrongPassword()
  newPassword!: string;
}
