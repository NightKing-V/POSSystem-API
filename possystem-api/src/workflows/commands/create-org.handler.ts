import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrgCommand } from './create-org.command';
import { PrismaService } from '../../prisma/prisma.service';

@CommandHandler(CreateOrgCommand)
export class CreateOrgHandler implements ICommandHandler<CreateOrgCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateOrgCommand) {
    const { createOrgDto, ownerId } = command;

    // Resolve categoryId
    let categoryId = createOrgDto.businesscategory_id;

    if (!categoryId && createOrgDto.businessType) {
      let categoryType = 'SERVICES';
      const typeLower = createOrgDto.businessType.toLowerCase();
      if (typeLower === 'retail') categoryType = 'RETAIL';
      else if (typeLower === 'restaurant') categoryType = 'RESTAURANT';
      else if (typeLower === 'service') categoryType = 'SERVICES';
      else if (typeLower === 'apparel') categoryType = 'APPAREL';
      else if (typeLower === 'supermarket') categoryType = 'SUPERMARKET';
      else if (typeLower === 'pharmacy') categoryType = 'PHARMACY';
      else if (typeLower === 'electronics') categoryType = 'ELECTRONICS';

      let category = await this.prisma.businessCategory.findFirst({
        where: { type: categoryType },
      });
      if (!category) {
        category = await this.prisma.businessCategory.findFirst();
      }
      if (!category) {
        category = await this.prisma.businessCategory.create({
          data: { type: categoryType },
        });
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      throw new BadRequestException('Business category is required');
    }

    // Verify business category exists
    const category = await this.prisma.businessCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Business category not found');
    }

    // Verify owner user exists
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

    // Create the organization
    const org = await this.prisma.org.create({
      data: {
        owner_id: ownerId,
        businesscategory_id: categoryId,
        address: createOrgDto.address || null,
        phone: createOrgDto.phone || null,
      },
    });

    // Assign owner to the default Owner role in UserRole
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

    // Create default InventoryLocation (Branch)
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
