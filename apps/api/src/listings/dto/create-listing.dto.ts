import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  Length,
  Min,
  IsEnum,
} from 'class-validator';
import { ListingStatus } from '../../common/enums/listing-status.enum.js';

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  address!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10)
  zip!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  mlsNumber?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sqft?: number;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
