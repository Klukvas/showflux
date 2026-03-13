import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateShowingDto {
  @IsUUID()
  listingId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
