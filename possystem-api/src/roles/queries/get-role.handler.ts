import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetRoleQuery } from './get-role.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRoleQuery) {
    const { id } = query;
    const role = await this.prisma.orgRole.findUnique({
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
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }
}
