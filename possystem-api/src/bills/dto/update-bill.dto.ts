import { PartialType } from '@nestjs/mapped-types';
import { CreateBillDto } from './create-bill.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BillStatus } from '@prisma/client';

export class UpdateBillDto extends PartialType(CreateBillDto) {
  @IsEnum(BillStatus)
  @IsOptional()
  status?: BillStatus;
}

