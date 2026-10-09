import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { buildPermissionsSeedData } from './seeds/permissions.seed';
import { SYSTEM_ROLES_SEED } from './seeds/system-roles.seed';
import { ROLE_TEMPLATES_SEED } from './seeds/role-templates.seed';
import {
  BUSINESS_CATEGORIES_SEED,
  CategoryTemplateNode,
} from './seeds/business-categories.seed';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedCategoryTemplatesRecursive(
  businessCategoryId: string,
  nodes: CategoryTemplateNode[],
  parentId: string | null = null,
  level = 0,
) {
  for (const node of nodes) {
    let template = await prisma.productCategoryTemplate.findFirst({
      where: {
        businesscategory_id: businessCategoryId,
        parent_id: parentId,
        name: node.name,
      },
    });

    if (!template) {
      template = await prisma.productCategoryTemplate.create({
        data: {
          businesscategory_id: businessCategoryId,
          parent_id: parentId,
          name: node.name,
          level,
        },
      });
    } else if (template.level !== level) {
      template = await prisma.productCategoryTemplate.update({
        where: { id: template.id },
        data: { level },
      });
    }

    if (node.children && node.children.length > 0) {
      await seedCategoryTemplatesRecursive(
        businessCategoryId,
        node.children,
        template.id,
        level + 1,
      );
    }
  }
}

async function main() {
  console.log(
    '1. Seeding business categories and default product category templates...',
  );
  for (const catBlueprint of BUSINESS_CATEGORIES_SEED) {
    const businessCategory = await prisma.businessCategory.upsert({
      where: { type: catBlueprint.type },
      update: {},
      create: { type: catBlueprint.type },
    });

    await seedCategoryTemplatesRecursive(
      businessCategory.id,
      catBlueprint.defaultCategories,
      null,
      0,
    );
    console.log(
      `Synced business category & category templates: ${catBlueprint.type}`,
    );
  }

  console.log('2. Seeding permissions for all resources and actions...');
  const permData = buildPermissionsSeedData();

  await prisma.permission.createMany({
    data: permData,
    skipDuplicates: true,
  });

  const allPermissions = await prisma.permission.findMany();
  console.log(`Total permissions in database: ${allPermissions.length}`);

  console.log('3. Seeding platform-level system roles...');
  const validSystemRoleKeys = SYSTEM_ROLES_SEED.map((r) => r.key);
  await prisma.systemRole.deleteMany({
    where: { key: { notIn: validSystemRoleKeys } },
  });

  for (const roleBlueprint of SYSTEM_ROLES_SEED) {
    const systemRole = await prisma.systemRole.upsert({
      where: { key: roleBlueprint.key },
      update: {
        name: roleBlueprint.name,
        description: roleBlueprint.description,
      },
      create: {
        key: roleBlueprint.key,
        name: roleBlueprint.name,
        description: roleBlueprint.description,
      },
    });

    const matchedPermissions = allPermissions.filter((p) =>
      roleBlueprint.matchPermission(p),
    );

    if (matchedPermissions.length > 0) {
      await prisma.systemRolePermission.createMany({
        data: matchedPermissions.map((p) => ({
          system_role_id: systemRole.id,
          permission_id: p.id,
        })),
        skipDuplicates: true,
      });
    }

    console.log(
      `Synced system role [${systemRole.key}] "${systemRole.name}" with ${matchedPermissions.length} permissions.`,
    );
  }

  console.log('4. Seeding organization role templates (RoleTemplate)...');
  for (const tplBlueprint of ROLE_TEMPLATES_SEED) {
    const roleTemplate = await prisma.roleTemplate.upsert({
      where: { key: tplBlueprint.key },
      update: {
        name: tplBlueprint.name,
        description: tplBlueprint.description,
        is_entrypoint: tplBlueprint.is_entrypoint,
        is_location_scoped: tplBlueprint.is_location_scoped,
      },
      create: {
        key: tplBlueprint.key,
        name: tplBlueprint.name,
        description: tplBlueprint.description,
        is_entrypoint: tplBlueprint.is_entrypoint,
        is_location_scoped: tplBlueprint.is_location_scoped,
      },
    });

    const matchedPermissions = allPermissions.filter((p) =>
      tplBlueprint.matchPermission(p),
    );

    if (matchedPermissions.length > 0) {
      await prisma.roleTemplatePermission.createMany({
        data: matchedPermissions.map((p) => ({
          role_template_id: roleTemplate.id,
          permission_id: p.id,
        })),
        skipDuplicates: true,
      });
    }

    console.log(
      `Synced role template [${roleTemplate.key}] "${roleTemplate.name}" (entrypoint=${roleTemplate.is_entrypoint}) with ${matchedPermissions.length} permissions.`,
    );
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

