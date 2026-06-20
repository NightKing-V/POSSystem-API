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
