import { ICommand } from '@nestjs/cqrs';
import { CreateBrandDto } from '../dto/create-brand.dto';

export class CreateBrandCommand implements ICommand {
  constructor(public readonly createBrandDto: CreateBrandDto) {}
}
