import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrgCommand } from './create-org.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateOrgCommand)
export class CreateOrgHandler implements ICommandHandler<CreateOrgCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateOrgCommand) {
    const { createOrgDto, ownerId } = command;

    // 1. Resolve business category dynamically from the database
    let category: { id: string; type: string } | null = null;

    if (createOrgDto.businesscategory_id) {
      // Try by ID first
      category = await this.prisma.businessCategory.findUnique({
        where: { id: createOrgDto.businesscategory_id },
      });

      // If not found by ID, try matching type case-insensitively
      if (!category) {
        category = await this.prisma.businessCategory.findFirst({
          where: {
            type: {
              equals: createOrgDto.businesscategory_id.trim(),
              mode: 'insensitive',
            },
          },
        });
      }
    }

    if (!category && createOrgDto.businessType) {
      const typeTrimmed = createOrgDto.businessType.trim();

      // Check by ID if UUID was passed as businessType
      category = await this.prisma.businessCategory.findUnique({
        where: { id: typeTrimmed },
      });

      // Find by type case-insensitively in database
      if (!category) {
        category = await this.prisma.businessCategory.findFirst({
          where: {
            type: {
              equals: typeTrimmed,
              mode: 'insensitive',
            },
          },
        });
      }

      // If still not found, create new business category dynamically in database
      if (!category) {
        category = await this.prisma.businessCategory.create({
          data: {
            type: typeTrimmed.toUpperCase(),
          },
        });
      }
    }

    if (!category) {
      throw new BadRequestException('Business category is required');
    }

    // 2. Verify owner user exists
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    // 3. Create the organization
    const org = await this.prisma.org.create({
      data: {
        owner_id: ownerId,
        businesscategory_id: category.id,
        address: createOrgDto.address || null,
        phone: createOrgDto.phone || null,
      },
    });

    // 4. Assign owner to the default Owner role in UserRole
    let ownerRole = await this.prisma.role.findFirst({
      where: { name: 'Owner' },
    });

    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: {
          name: 'Owner',
          description: 'Organization Owner',
          is_system: true,
          is_location_scoped: false,
        },
      });
    }

    await this.prisma.userRole.create({
      data: {
        user_id: ownerId,
        role_id: ownerRole.id,
        org_id: org.id,
        assigned_by: ownerId,
      },
    });

    // 5. Create default InventoryLocation (Branch)
    await this.prisma.inventoryLocation.create({
      data: {
        org_id: org.id,
        name: createOrgDto.businessName || 'Main Branch',
        type: 'BRANCH',
        phone: createOrgDto.phone || null,
        address: createOrgDto.address || null,
        is_active: true,
      },
    });

    return org;
  }
}
