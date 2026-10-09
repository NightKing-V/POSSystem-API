import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetOrgQuery } from './get-org.query';
import { PrismaService } from '../../prisma/prisma.service';

@QueryHandler(GetOrgQuery)
export class GetOrgHandler implements IQueryHandler<GetOrgQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOrgQuery) {
    const { id } = query;
    const org = await this.prisma.org.findUnique({
      where: { id },
      include: {
        business_category: true,
        owner: true,
        members: {
          include: {
            role: true,
            user: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }
}
