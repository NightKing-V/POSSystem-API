import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UnassignUserLocationCommand } from './unassign-user-location.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(UnassignUserLocationCommand)
export class UnassignUserLocationHandler implements ICommandHandler<UnassignUserLocationCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UnassignUserLocationCommand) {
    const { locationId, userId } = command;

    const existing = await this.prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Assignment of user "${userId}" to location "${locationId}" not found`,
      );
    }

    await this.prisma.userLocation.delete({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    return { message: 'User unassigned from location successfully' };
  }
}
