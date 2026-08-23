import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateOrgCommand } from './update-org.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UpdateOrgCommand)
export class UpdateOrgHandler implements ICommandHandler<UpdateOrgCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateOrgCommand) {
    const { id, updateOrgDto } = command;

    const org = await this.prisma.org.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    if (updateOrgDto.businesscategory_id) {
      const category = await this.prisma.businessCategory.findUnique({
        where: { id: updateOrgDto.businesscategory_id },
      });
      if (!category) {
        throw new BadRequestException('Business category not found');
      }
    }

    return this.prisma.org.update({
      where: { id },
      data: {
        businesscategory_id: updateOrgDto.businesscategory_id,
        address: updateOrgDto.address,
        phone: updateOrgDto.phone,
      },
    });
  }
}
