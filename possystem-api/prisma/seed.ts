import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding business categories...');
  const categories = [
    { type: 'RETAIL' },
    { type: 'RESTAURANT' },
    { type: 'SUPERMARKET' },
    { type: 'PHARMACY' },
    { type: 'ELECTRONICS' },
    { type: 'APPAREL' },
    { type: 'SERVICES' },
  ];

  for (const cat of categories) {
    const existing = await prisma.businessCategory.findFirst({
      where: { type: cat.type },
    });
    if (!existing) {
      await prisma.businessCategory.create({
        data: { type: cat.type },
      });
      console.log(`Created business category: ${cat.type}`);
    } else {
      console.log(`Business category already exists: ${cat.type}`);
    }
  }

  console.log('Seeding default roles...');
  const roles = [
    {
      name: 'Admin',
      description: 'System-wide Administrator',
      is_system: true,
      is_location_scoped: false,
    },
    {
      name: 'Owner',
      description: 'Organization Owner',
      is_system: true,
      is_location_scoped: false,
    },
    {
      name: 'Manager',
      description: 'Location Manager',
      is_system: true,
      is_location_scoped: true,
    },
    {
      name: 'Cashier',
      description: 'Location Cashier',
      is_system: true,
      is_location_scoped: true,
    },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name },
    });
    if (!existing) {
      await prisma.role.create({
        data: role,
      });
      console.log(`Created role: ${role.name}`);
    } else {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          description: role.description,
          is_system: role.is_system,
          is_location_scoped: role.is_location_scoped,
        },
      });
      console.log(`Updated role: ${role.name}`);
    }
  }

  console.log('Seeding permissions for all resources and actions...');
  const resources = [
    'orgs',
    'org',
    'users',
    'user',
    'roles',
    'role',
    'permissions',
    'permission',
    'products',
    'product',
    'categories',
    'category',
    'brands',
    'brand',
    'discounts',
    'discount',
    'inventory',
    'locations',
    'location',
    'suppliers',
    'supplier',
    'purchase_orders',
    'purchase_order',
    'customers',
    'customer',
    'loyalty',
    'bills',
    'bill',
    'payments',
    'payment',
    'all',
    '*',
  ];

  const actions = ['create', 'read', 'update', 'delete', 'manage', '*'];

  const permData: { resource: string; action: string; description: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      permData.push({
        resource,
        action,
        description: `Permission to ${action} ${resource}`,
      });
    }
  }

  await prisma.permission.createMany({
    data: permData,
    skipDuplicates: true,
  });

  const allPermissions = await prisma.permission.findMany();
  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });

  if (adminRole) {
    const rolePermData = allPermissions.map((p) => ({
      role_id: adminRole.id,
      permission_id: p.id,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermData,
      skipDuplicates: true,
    });
    console.log(`Assigned all ${allPermissions.length} permissions to Admin role.`);
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
