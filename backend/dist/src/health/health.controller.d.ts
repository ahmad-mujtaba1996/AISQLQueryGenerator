import { PrismaService } from '../database/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): {
        status: string;
        service: string;
        version: string;
        database: string;
        securityGuard: string;
        geminiEngine: string;
        timestamp: string;
        uptimeSeconds: number;
    };
}
