import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination';

export class GetPermissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'System or Org Role UUID (accepts roleId or lowercase roleid)',
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Alternative lowercase roleId query param',
  })
  @IsOptional()
  @IsString()
  roleid?: string;

  @ApiPropertyOptional({
    description: 'Filter by exact resource name (e.g., products, bills)',
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({
    description:
      'Filter by exact action name (e.g., create, read, update, delete, manage)',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive search across resource, action, and description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
