"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const seed_data_1 = require("./seed-data");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Starting DataPulse AI Database Seeding ---');
    console.log('Clearing existing records...');
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;`);
    }
    catch (err) {
    }
    console.log(`Seeding ${seed_data_1.SEED_USERS.length} users...`);
    for (const u of seed_data_1.SEED_USERS) {
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
    console.log(`Seeding ${seed_data_1.SEED_PRODUCTS.length} products...`);
    for (const p of seed_data_1.SEED_PRODUCTS) {
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
    console.log(`Seeding ${seed_data_1.SEED_ORDERS.length} orders...`);
    for (const o of seed_data_1.SEED_ORDERS) {
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
//# sourceMappingURL=seed.js.map