import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPermissionsQuery } from './get-permissions.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.permission.findMany();
  }
}
