import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { CreatePermissionCommand } from './create-permission.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreatePermissionCommand) {
    const { createPermissionDto } = command;

    const existing = await this.prisma.permission.findFirst({
      where: {
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Permission already exists for this resource and action',
      );
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }
}
