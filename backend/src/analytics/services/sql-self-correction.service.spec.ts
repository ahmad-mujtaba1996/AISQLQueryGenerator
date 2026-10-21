import { SqlSelfCorrectionService } from './sql-self-correction.service';
import { SqlGenerationService } from './sql-generation.service';
import { SqlSecurityValidationService, SecurityValidationResult } from './sql-security-validation.service';
import { SqlExecutionService, SqlExecutionException } from './sql-execution.service';
import { AnalyzedIntent } from './intent-analysis.service';

describe('SqlSelfCorrectionService (Controlled Self-Correction)', () => {
  let service: SqlSelfCorrectionService;
  let mockSqlGen: Partial<SqlGenerationService>;
  let mockSecurityValidator: Partial<SqlSecurityValidationService>;
  let mockSqlExecution: Partial<SqlExecutionService>;

  const mockIntent: AnalyzedIntent = {
    category: 'ranking',
    primaryMetric: 'revenue',
    tables: ['users', 'orders'],
    suggestedChartType: 'bar',
    confidence: 0.95,
    isSafe: true,
  };

  const initialValidation: SecurityValidationResult = {
    isValid: true,
    astParsed: true,
    statementType: 'SELECT',
    tablesAccessed: ['users'],
    functionsUsed: [],
    hasLimitClause: true,
    enforcedLimit: 10,
    sanitizedSql: 'SELECT * FROM users LIMIT 10;',
    auditNotes: ['Initial validation passed'],
  };

  beforeEach(() => {
    mockSqlGen = {
      generateSql: jest.fn(),
    };
    mockSecurityValidator = {
      validate: jest.fn(),
    };
    mockSqlExecution = {
      execute: jest.fn(),
    };

    service = new SqlSelfCorrectionService(
      mockSqlGen as SqlGenerationService,
      mockSecurityValidator as SqlSecurityValidationService,
      mockSqlExecution as SqlExecutionService,
    );
  });

  it('should immediately return result if initial execution succeeds (0 retries)', async () => {
    (mockSqlExecution.execute as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      columns: ['id'],
      rowCount: 1,
      durationMs: 5,
      mode: 'secure_sandbox',
      roleUsed: 'sandbox',
    });

    const res = await service.executeWithSelfCorrection('Show users', mockIntent, initialValidation);
    expect(res.retriesAttempted).toBe(0);
    expect(res.corrected).toBe(false);
    expect(mockSqlGen.generateSql).not.toHaveBeenCalled();
  });

  it('should NEVER retry authorization failures or permission denials', async () => {
    (mockSqlExecution.execute as jest.Mock).mockRejectedValueOnce(
      new SqlExecutionException('permission denied for relation secret_table', true),
    );

    await expect(
      service.executeWithSelfCorrection('Show users', mockIntent, initialValidation),
    ).rejects.toThrow('permission denied');

    expect(mockSqlGen.generateSql).not.toHaveBeenCalled();
  });

  it('should retry correctable runtime errors up to 2 times and succeed if fixed', async () => {
    // 1st attempt fails with syntax/column error
    (mockSqlExecution.execute as jest.Mock).mockRejectedValueOnce(
      new SqlExecutionException('column u.usr_name does not exist', false),
    );

    // LLM generates corrected SQL
    (mockSqlGen.generateSql as jest.Mock).mockResolvedValueOnce('SELECT u.name FROM users u LIMIT 10;');

    // Validator validates corrected query
    (mockSecurityValidator.validate as jest.Mock).mockReturnValueOnce({
      ...initialValidation,
      sanitizedSql: 'SELECT u.name FROM users u LIMIT 10;',
    });

    // 2nd execution attempt succeeds
    (mockSqlExecution.execute as jest.Mock).mockResolvedValueOnce({
      rows: [{ name: 'Sarah' }],
      columns: ['name'],
      rowCount: 1,
      durationMs: 4,
      mode: 'secure_sandbox',
      roleUsed: 'sandbox',
    });

    const res = await service.executeWithSelfCorrection('Show users', mockIntent, initialValidation);
    expect(res.retriesAttempted).toBe(1);
    expect(res.corrected).toBe(true);
    expect(res.execution.rows[0].name).toBe('Sarah');
  });

  it('should abort after maximum 2 retries if errors persist', async () => {
    (mockSqlExecution.execute as jest.Mock).mockRejectedValue(
      new SqlExecutionException('persistent column error', false),
    );

    (mockSqlGen.generateSql as jest.Mock).mockResolvedValue('SELECT * FROM users LIMIT 10;');
    (mockSecurityValidator.validate as jest.Mock).mockReturnValue(initialValidation);

    await expect(
      service.executeWithSelfCorrection('Show users', mockIntent, initialValidation),
    ).rejects.toThrow(/self-correction attempts/);

    expect(mockSqlGen.generateSql).toHaveBeenCalledTimes(2);
  });
});
