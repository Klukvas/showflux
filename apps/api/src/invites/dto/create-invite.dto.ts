import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInviteDto {
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email!: string;
}
