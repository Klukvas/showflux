import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { OfferStatus } from '../../common/enums/offer-status.enum.js';

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyerName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offerAmount?: number;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
