import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AcceptInviteDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (value as string).trim())
  fullName!: string;
}
