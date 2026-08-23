import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetRolesQuery } from './get-roles.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
}
