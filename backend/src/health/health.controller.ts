import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'DataPulse AI Analytics Engine',
      version: '1.0.0',
      database: this.prisma.getIsConnected() ? 'connected_live_supabase' : 'active_secure_sandbox',
      securityGuard: 'ast_validator_active',
      geminiEngine:
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
          ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
          : 'deterministic_semantic_engine',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
