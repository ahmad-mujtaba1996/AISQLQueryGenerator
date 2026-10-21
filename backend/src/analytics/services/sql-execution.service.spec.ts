import { SqlExecutionService, SqlExecutionException } from './sql-execution.service';
import { PrismaService } from '../../database/prisma.service';

describe('SqlExecutionService (Safe Engine & Sandbox)', () => {
  let service: SqlExecutionService;
  let mockPrisma: Partial<PrismaService>;

  beforeEach(async () => {
    mockPrisma = {
      getIsConnected: jest.fn().mockReturnValue(false),
      $queryRawUnsafe: jest.fn(),
    };

    service = new SqlExecutionService(mockPrisma as PrismaService);
    await service.onModuleInit();
  });

  describe('Sandbox Execution with Golden Seed Data', () => {
    it('should successfully execute valid SELECT on seeded sandbox', async () => {
      const sql = 'SELECT COUNT(*) AS total FROM users;';
      const result = await service.execute(sql);

      expect(result.rowCount).toBe(1);
      expect(Number(result.rows[0].total)).toBe(12);
      expect(result.mode).toBe('secure_sandbox');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should compute verified revenue aggregation correctly', async () => {
      const sql = "SELECT SUM(amount) AS completed_revenue FROM orders WHERE status = 'completed';";
      const result = await service.execute(sql);

      expect(result.rowCount).toBe(1);
      expect(Number(result.rows[0].completed_revenue)).toBe(38285);
    });

    it('should throw SqlExecutionException on invalid syntax or nonexistent column', async () => {
      const sql = 'SELECT nonexistent_column FROM users;';
      await expect(service.execute(sql)).rejects.toThrow(SqlExecutionException);
    });
  });

  describe('Authorization Failure Detection', () => {
    it('should mark authorization errors with isAuthorizationError flag', () => {
      const isAuth = (service as any).isAuthError('ERROR: permission denied for table secret_accounts');
      expect(isAuth).toBe(true);
    });

    it('should not mark syntax errors as authorization errors', () => {
      const isAuth = (service as any).isAuthError('syntax error at or near "SELCT"');
      expect(isAuth).toBe(false);
    });
  });
});
