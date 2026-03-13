import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/, { message: 'Invalid token format' })
  token!: string;

  @IsString()
  @Length(8, 128)
  password!: string;
}
