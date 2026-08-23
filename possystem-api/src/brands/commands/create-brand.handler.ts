import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBrandCommand } from './create-brand.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateBrandCommand)
export class CreateBrandHandler implements ICommandHandler<CreateBrandCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateBrandCommand) {
    const { createBrandDto } = command;
    return this.prisma.brand.create({
      data: {
        name: createBrandDto.name,
      },
    });
  }
}
