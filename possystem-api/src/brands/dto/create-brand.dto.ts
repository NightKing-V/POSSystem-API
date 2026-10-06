import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBrandDto {
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
