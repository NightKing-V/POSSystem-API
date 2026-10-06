import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
      category = await this.prisma.businessCategory.findUnique({
        where: { id: createOrgDto.businesscategory_id },
      });

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

      category = await this.prisma.businessCategory.findUnique({
        where: { id: typeTrimmed },
      });

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

    // 3. Provision organization, built-in OrgRoles, entrypoint UserRole,
    //    default ProductCategories from templates, and initial Branch atomically
    return this.prisma.$transaction(async (tx) => {
      // 3a. Load SystemRole blueprints marked as organization templates
      const roleTemplates = await tx.systemRole.findMany({
        where: { is_org_template: true },
        include: { permissions: true },
      });

      if (roleTemplates.length === 0) {
        throw new InternalServerErrorException(
          'System role templates are not seeded. Please run `npx prisma db seed`.',
        );
      }

      const hasEntrypoint = roleTemplates.some((r) => r.is_org_entrypoint);
      if (!hasEntrypoint) {
        throw new InternalServerErrorException(
          'No entrypoint system role template configured (`is_org_entrypoint: true`).',
        );
      }

      // 3b. Create the Organization
      const org = await tx.org.create({
        data: {
          owner_id: ownerId,
          businesscategory_id: category.id,
          address: createOrgDto.address || null,
          phone: createOrgDto.phone || null,
        },
      });

      // 3c. Clone SystemRole templates into OrgRole + OrgRolePermission for this Org
      let entrypointOrgRoleId: string | null = null;

      for (const tpl of roleTemplates) {
        const orgRole = await tx.orgRole.create({
          data: {
            org_id: org.id,
            system_role_id: tpl.id,
            name: tpl.name,
            description: tpl.description,
            is_builtin: true,
            is_entrypoint: tpl.is_org_entrypoint,
            is_location_scoped: tpl.is_location_scoped,
          },
        });

        if (tpl.permissions && tpl.permissions.length > 0) {
          await tx.orgRolePermission.createMany({
            data: tpl.permissions.map((rp) => ({
              org_role_id: orgRole.id,
              permission_id: rp.permission_id,
            })),
            skipDuplicates: true,
          });
        }

        if (orgRole.is_entrypoint) {
          entrypointOrgRoleId = orgRole.id;
        }
      }

      // 3d. Assign creator to the newly provisioned entrypoint OrgRole
      await tx.userRole.create({
        data: {
          user_id: ownerId,
          role_id: entrypointOrgRoleId!,
          org_id: org.id,
          assigned_by: ownerId,
        },
      });

      // 3e. Clone ProductCategoryTemplate hierarchy for this BusinessCategory into ProductCategory
      const categoryTemplates = await tx.productCategoryTemplate.findMany({
        where: { businesscategory_id: category.id },
        orderBy: { level: 'asc' },
      });

      if (categoryTemplates.length > 0) {
        const templateToOrgCategoryMap = new Map<string, string>();

        for (const catTpl of categoryTemplates) {
          const parentOrgCatId = catTpl.parent_id
            ? (templateToOrgCategoryMap.get(catTpl.parent_id) ?? null)
            : null;

          const createdCat = await tx.productCategory.create({
            data: {
              org_id: org.id,
              template_id: catTpl.id,
              parent_id: parentOrgCatId,
              name: catTpl.name,
              level: catTpl.level,
            },
          });

          templateToOrgCategoryMap.set(catTpl.id, createdCat.id);
        }
      }

      // 3f. Create default InventoryLocation (Branch)
      await tx.inventoryLocation.create({
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
    }, {
      maxWait: 10000,
      timeout: 30000,
    });
  }
}
