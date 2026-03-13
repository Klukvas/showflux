import {
  IsDateString,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ShowingStatus } from '../../common/enums/showing-status.enum.js';

export class UpdateShowingDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsEnum(ShowingStatus)
  status?: ShowingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
