import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

export class CreateOfferDto {
  @IsUUID()
  listingId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  buyerName!: string;

  @IsNumber()
  @Min(0)
  offerAmount!: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
