import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSystemRolesQuery } from './get-system-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetSystemRolesQuery)
export class GetSystemRolesHandler implements IQueryHandler<GetSystemRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.systemRole.findMany({
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    });
  }
}

