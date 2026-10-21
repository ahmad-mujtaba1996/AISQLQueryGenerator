import { PrismaClient } from '@prisma/client';
import { SEED_USERS, SEED_PRODUCTS, SEED_ORDERS } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting DataPulse AI Database Seeding ---');

  // Clear existing records in correct relation order
  console.log('Clearing existing records...');
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset auto-increment sequences if on PostgreSQL
  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;`);
  } catch (err) {
    // Ignore if not supported or not postgres
  }

  console.log(`Seeding ${SEED_USERS.length} users...`);
  for (const u of SEED_USERS) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        country: u.country,
        createdAt: new Date(u.createdAt),
      },
    });
  }

  console.log(`Seeding ${SEED_PRODUCTS.length} products...`);
  for (const p of SEED_PRODUCTS) {
    await prisma.product.create({
      data: {
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        createdAt: new Date(p.createdAt),
      },
    });
  }

  console.log(`Seeding ${SEED_ORDERS.length} orders...`);
  for (const o of SEED_ORDERS) {
    await prisma.order.create({
      data: {
        id: o.id,
        userId: o.userId,
        productId: o.productId,
        amount: o.amount,
        status: o.status,
        createdAt: new Date(o.createdAt),
      },
    });
  }

  console.log('--- Seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
