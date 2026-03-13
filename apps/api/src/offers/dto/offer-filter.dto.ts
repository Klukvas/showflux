import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { OfferStatus } from '../../common/enums/offer-status.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class OfferFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;
}
