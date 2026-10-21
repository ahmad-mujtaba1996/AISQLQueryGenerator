export interface SeedUser {
    id: number;
    name: string;
    email: string;
    country: string;
    createdAt: string;
}
export interface SeedProduct {
    id: number;
    title: string;
    category: string;
    price: number;
    createdAt: string;
}
export interface SeedOrder {
    id: number;
    userId: number;
    productId: number;
    amount: number;
    status: 'completed' | 'pending' | 'cancelled' | 'refunded';
    createdAt: string;
}
export declare const SEED_USERS: SeedUser[];
export declare const SEED_PRODUCTS: SeedProduct[];
export declare const SEED_ORDERS: SeedOrder[];
