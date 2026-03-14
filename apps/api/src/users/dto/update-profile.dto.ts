import { IsOptional, IsString, Length, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_tld: true, require_protocol: true })
  avatarUrl?: string;
}
