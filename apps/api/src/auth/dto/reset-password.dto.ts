import { IsString, Matches } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/strong-password.validator.js';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'Invalid token format' })
  token!: string;

  @IsStrongPassword()
  password!: string;
}
