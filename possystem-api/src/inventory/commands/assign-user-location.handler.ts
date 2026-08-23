import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { AssignUserLocationCommand } from './assign-user-location.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(AssignUserLocationCommand)
export class AssignUserLocationHandler implements ICommandHandler<AssignUserLocationCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AssignUserLocationCommand) {
    const { locationId, userId, assignerId } = command;

    const location = await this.prisma.inventoryLocation.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Inventory location with ID "${locationId}" not found`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (assignerId) {
      const assigner = await this.prisma.user.findUnique({
        where: { id: assignerId },
      });
      if (!assigner) {
        throw new NotFoundException(
          `Assigner user with ID "${assignerId}" not found`,
        );
      }
    }

    const existing = await this.prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userLocation.create({
      data: {
        user_id: userId,
        location_id: locationId,
        assigned_by: assignerId || null,
      },
      include: {
        user: true,
        location: true,
      },
    });
  }
}
