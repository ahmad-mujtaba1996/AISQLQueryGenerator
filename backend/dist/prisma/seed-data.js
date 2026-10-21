"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_ORDERS = exports.SEED_PRODUCTS = exports.SEED_USERS = void 0;
exports.SEED_USERS = [
    { id: 1, name: 'Sarah Connor', email: 'sarah.c@cyberdyne.io', country: 'United States', createdAt: '2026-01-05T09:00:00Z' },
    { id: 2, name: 'Liam Davies', email: 'liam.d@meridian.uk', country: 'United Kingdom', createdAt: '2026-01-12T10:30:00Z' },
    { id: 3, name: 'Amara Okafor', email: 'amara.o@nexustech.de', country: 'Germany', createdAt: '2026-02-01T14:15:00Z' },
    { id: 4, name: 'Hiroshi Tanaka', email: 'hiroshi.t@sakura.jp', country: 'Japan', createdAt: '2026-02-18T08:00:00Z' },
    { id: 5, name: 'Elena Rostova', email: 'elena.r@nordicai.se', country: 'Sweden', createdAt: '2026-03-04T11:45:00Z' },
    { id: 6, name: 'Lucas Silva', email: 'lucas.s@solarsys.br', country: 'Brazil', createdAt: '2026-03-22T16:20:00Z' },
    { id: 7, name: 'Chloe Martin', email: 'chloe.m@lumina.fr', country: 'France', createdAt: '2026-04-10T13:10:00Z' },
    { id: 8, name: 'Marcus Vance', email: 'marcus.v@imperium.it', country: 'Italy', createdAt: '2026-05-02T09:50:00Z' },
    { id: 9, name: 'Priya Sharma', email: 'priya.s@vedicdata.in', country: 'India', createdAt: '2026-06-15T12:00:00Z' },
    { id: 10, name: 'Alexander Wright', email: 'alex.w@aurora.ca', country: 'Canada', createdAt: '2026-07-01T15:30:00Z' },
    { id: 11, name: 'Sophia Wang', email: 'sophia.w@zenith.sg', country: 'Singapore', createdAt: '2026-08-08T10:15:00Z' },
    { id: 12, name: 'David Kim', email: 'david.k@koreasol.kr', country: 'South Korea', createdAt: '2026-09-03T08:45:00Z' }
];
exports.SEED_PRODUCTS = [
    { id: 1, title: 'Enterprise Cloud Platform', category: 'Infrastructure', price: 2499.00, createdAt: '2026-01-01T00:00:00Z' },
    { id: 2, title: 'AI Predictive Copilot', category: 'AI & ML', price: 1299.00, createdAt: '2026-01-01T00:00:00Z' },
    { id: 3, title: 'Data Warehouse Pipeline', category: 'Analytics', price: 850.00, createdAt: '2026-01-01T00:00:00Z' },
    { id: 4, title: 'Realtime Event Streamer', category: 'Infrastructure', price: 650.00, createdAt: '2026-01-01T00:00:00Z' },
    { id: 5, title: 'Cyber Threat Sentinel', category: 'Security', price: 1750.00, createdAt: '2026-01-01T00:00:00Z' },
    { id: 6, title: 'Executive BI Dashboard', category: 'Analytics', price: 499.00, createdAt: '2026-01-01T00:00:00Z' }
];
exports.SEED_ORDERS = [
    { id: 1, userId: 1, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-01-10T14:00:00Z' },
    { id: 2, userId: 2, productId: 3, amount: 850.00, status: 'completed', createdAt: '2026-01-18T16:30:00Z' },
    { id: 3, userId: 1, productId: 2, amount: 1299.00, status: 'completed', createdAt: '2026-01-25T11:20:00Z' },
    { id: 4, userId: 3, productId: 5, amount: 1750.00, status: 'completed', createdAt: '2026-02-05T09:15:00Z' },
    { id: 5, userId: 4, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-02-14T10:00:00Z' },
    { id: 6, userId: 2, productId: 4, amount: 650.00, status: 'cancelled', createdAt: '2026-02-22T17:45:00Z' },
    { id: 7, userId: 5, productId: 2, amount: 1299.00, status: 'completed', createdAt: '2026-03-08T13:30:00Z' },
    { id: 8, userId: 6, productId: 6, amount: 499.00, status: 'completed', createdAt: '2026-03-15T15:00:00Z' },
    { id: 9, userId: 5, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-03-29T12:00:00Z' },
    { id: 10, userId: 7, productId: 5, amount: 1750.00, status: 'completed', createdAt: '2026-04-12T11:00:00Z' },
    { id: 11, userId: 1, productId: 4, amount: 650.00, status: 'completed', createdAt: '2026-04-20T16:40:00Z' },
    { id: 12, userId: 8, productId: 3, amount: 850.00, status: 'completed', createdAt: '2026-05-09T08:30:00Z' },
    { id: 13, userId: 3, productId: 2, amount: 1299.00, status: 'refunded', createdAt: '2026-05-18T14:10:00Z' },
    { id: 14, userId: 5, productId: 5, amount: 1750.00, status: 'completed', createdAt: '2026-05-27T10:00:00Z' },
    { id: 15, userId: 9, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-06-18T13:20:00Z' },
    { id: 16, userId: 4, productId: 6, amount: 499.00, status: 'completed', createdAt: '2026-06-25T15:30:00Z' },
    { id: 17, userId: 10, productId: 2, amount: 1299.00, status: 'completed', createdAt: '2026-07-05T09:40:00Z' },
    { id: 18, userId: 7, productId: 3, amount: 850.00, status: 'completed', createdAt: '2026-07-19T11:15:00Z' },
    { id: 19, userId: 11, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-08-11T14:50:00Z' },
    { id: 20, userId: 1, productId: 5, amount: 1750.00, status: 'completed', createdAt: '2026-08-22T16:00:00Z' },
    { id: 21, userId: 8, productId: 4, amount: 650.00, status: 'pending', createdAt: '2026-08-30T10:30:00Z' },
    { id: 22, userId: 12, productId: 2, amount: 1299.00, status: 'completed', createdAt: '2026-09-07T12:15:00Z' },
    { id: 23, userId: 5, productId: 3, amount: 850.00, status: 'completed', createdAt: '2026-09-14T09:00:00Z' },
    { id: 24, userId: 3, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-09-28T15:20:00Z' },
    { id: 25, userId: 2, productId: 2, amount: 1299.00, status: 'completed', createdAt: '2026-10-04T10:00:00Z' },
    { id: 26, userId: 9, productId: 5, amount: 1750.00, status: 'completed', createdAt: '2026-10-11T13:45:00Z' },
    { id: 27, userId: 6, productId: 1, amount: 2499.00, status: 'completed', createdAt: '2026-10-15T11:30:00Z' },
    { id: 28, userId: 10, productId: 6, amount: 499.00, status: 'completed', createdAt: '2026-10-18T16:10:00Z' },
    { id: 29, userId: 11, productId: 4, amount: 650.00, status: 'pending', createdAt: '2026-10-20T14:20:00Z' },
    { id: 30, userId: 12, productId: 5, amount: 1750.00, status: 'cancelled', createdAt: '2026-10-21T08:00:00Z' }
];
//# sourceMappingURL=seed-data.js.map