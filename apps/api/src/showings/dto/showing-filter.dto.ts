import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ShowingStatus } from '../../common/enums/showing-status.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ShowingFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ShowingStatus)
  status?: ShowingStatus;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
