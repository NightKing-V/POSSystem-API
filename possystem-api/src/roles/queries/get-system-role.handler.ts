import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetSystemRoleQuery } from './get-system-role.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSystemRoleQuery)
export class GetSystemRoleHandler implements IQueryHandler<GetSystemRoleQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSystemRoleQuery) {
    const { id } = query;
    const role = await this.prisma.systemRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`System role with ID "${id}" not found`);
    }

    return role;
  }
}
