import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/strong-password.validator.js';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsStrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  workspaceName!: string;
}
