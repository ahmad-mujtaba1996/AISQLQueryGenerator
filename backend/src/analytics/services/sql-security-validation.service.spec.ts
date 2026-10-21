import { SqlSecurityValidationService, SqlSecurityException } from './sql-security-validation.service';

describe('SqlSecurityValidationService (AST Security Guard)', () => {
  let service: SqlSecurityValidationService;

  beforeEach(() => {
    service = new SqlSecurityValidationService();
  });

  describe('Valid SELECT Queries', () => {
    it('should approve standard SELECT query on approved tables', () => {
      const sql = 'SELECT id, name, country FROM users WHERE country = \'United States\' LIMIT 10;';
      const result = service.validate(sql);

      expect(result.isValid).toBe(true);
      expect(result.statementType).toBe('SELECT');
      expect(result.tablesAccessed).toContain('users');
      expect(result.enforcedLimit).toBe(10);
      expect(result.sanitizedSql).toContain('LIMIT 10');
    });

    it('should approve relational JOIN queries across users, orders, and products', () => {
      const sql = `
        SELECT u.name, SUM(o.amount) AS total
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN products p ON o.product_id = p.id
        WHERE o.status = 'completed'
        GROUP BY u.name
        ORDER BY total DESC
        LIMIT 5;
      `;
      const result = service.validate(sql);

      expect(result.isValid).toBe(true);
      expect(result.tablesAccessed).toEqual(expect.arrayContaining(['users', 'orders', 'products']));
      expect(result.functionsUsed).toContain('sum');
      expect(result.enforcedLimit).toBe(5);
    });

    it('should inject safe default LIMIT 100 when query has no LIMIT clause', () => {
      const sql = 'SELECT * FROM products;';
      const result = service.validate(sql);

      expect(result.isValid).toBe(true);
      expect(result.hasLimitClause).toBe(false);
      expect(result.enforcedLimit).toBe(100);
      expect(result.sanitizedSql).toContain('LIMIT 100');
    });

    it('should clamp excessive LIMIT (> 500) down to 500', () => {
      const sql = 'SELECT * FROM orders LIMIT 2500;';
      const result = service.validate(sql);

      expect(result.isValid).toBe(true);
      expect(result.enforcedLimit).toBe(500);
      expect(result.sanitizedSql).toContain('LIMIT 500');
    });
  });

  describe('Rejection of Write Operations & DDL', () => {
    it('should strictly reject DELETE statements', () => {
      expect(() => service.validate('DELETE FROM users WHERE id = 1;')).toThrow(SqlSecurityException);
      expect(() => service.validate('DELETE FROM users WHERE id = 1;')).toThrow(/Forbidden statement type 'delete'/);
    });

    it('should strictly reject INSERT statements', () => {
      expect(() => service.validate("INSERT INTO users (name, email) VALUES ('Hacker', 'h@x.com');")).toThrow(
        SqlSecurityException,
      );
    });

    it('should strictly reject UPDATE statements', () => {
      expect(() => service.validate("UPDATE users SET name = 'Attacker';")).toThrow(SqlSecurityException);
    });

    it('should strictly reject DROP TABLE statements', () => {
      expect(() => service.validate('DROP TABLE users;')).toThrow(SqlSecurityException);
    });

    it('should strictly reject ALTER TABLE statements', () => {
      expect(() => service.validate('ALTER TABLE users ADD COLUMN is_admin BOOLEAN;')).toThrow(SqlSecurityException);
    });

    it('should strictly reject TRUNCATE statements', () => {
      expect(() => service.validate('TRUNCATE TABLE orders;')).toThrow(SqlSecurityException);
    });
  });

  describe('Multi-Statement Batch Rejection', () => {
    it('should reject piggybacked multiple statements', () => {
      const sql = 'SELECT * FROM users; DROP TABLE orders;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
      expect(() => service.validate(sql)).toThrow(/Multiple SQL statements detected/);
    });

    it('should reject multiple queries concatenated with semicolons', () => {
      const sql = 'SELECT 1; SELECT 2;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
    });
  });

  describe('Unauthorized Table Access', () => {
    it('should reject access to PostgreSQL system catalogs (pg_user, pg_shadow)', () => {
      const sql = 'SELECT * FROM pg_catalog.pg_user;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
      expect(() => service.validate(sql)).toThrow(/Access to table.*is unauthorized/);
    });

    it('should reject access to information_schema', () => {
      const sql = 'SELECT table_name FROM information_schema.tables;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
    });

    it('should reject access to non-whitelisted arbitrary tables', () => {
      const sql = 'SELECT * FROM sensitive_audit_logs;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
      expect(() => service.validate(sql)).toThrow(/Only approved analytics tables/);
    });
  });

  describe('Dangerous Functions Blacklist', () => {
    it('should reject pg_sleep() time-based injection attacks', () => {
      const sql = 'SELECT u.name FROM users u WHERE u.id = 1 AND pg_sleep(5) IS NULL;';
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
      expect(() => service.validate(sql)).toThrow(/unapproved function 'pg_sleep\(\)'/);
    });

    it('should reject dblink execution', () => {
      const sql = "SELECT * FROM users WHERE dblink('host=attacker.com', 'SELECT 1') IS NOT NULL;";
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
    });
  });

  describe('Query Complexity Limits', () => {
    it('should reject queries exceeding maximum permitted join count', () => {
      // 6 joins exceeds MAX_JOINS (5)
      const sql = `
        SELECT u.name
        FROM users u
        JOIN orders o1 ON u.id = o1.user_id
        JOIN orders o2 ON u.id = o2.user_id
        JOIN orders o3 ON u.id = o3.user_id
        JOIN orders o4 ON u.id = o4.user_id
        JOIN orders o5 ON u.id = o5.user_id
        JOIN orders o6 ON u.id = o6.user_id;
      `;
      expect(() => service.validate(sql)).toThrow(SqlSecurityException);
      expect(() => service.validate(sql)).toThrow(/Query complexity exceeded/);
    });
  });
});
