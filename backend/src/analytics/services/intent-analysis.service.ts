import { Injectable, BadRequestException, Logger } from '@nestjs/common';

export type QueryIntentCategory =
  | 'ranking'
  | 'time_trend'
  | 'comparison'
  | 'aggregation'
  | 'filtering'
  | 'general';

export interface AnalyzedIntent {
  category: QueryIntentCategory;
  primaryMetric: string;
  tables: string[];
  timeDimension?: string;
  statusFilter?: string;
  suggestedChartType: 'bar' | 'line' | 'pie' | 'area' | 'table';
  confidence: number;
  isSafe: boolean;
  securityNotes?: string;
}

@Injectable()
export class IntentAnalysisService {
  private readonly logger = new Logger(IntentAnalysisService.name);

  // Adversarial injection patterns
  private readonly adversarialPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /disregard\s+(the\s+)?(prompt|system|rules)/i,
    /you\s+are\s+now\s+(in\s+)?(dan|jailbreak|developer|god)\s+mode/i,
    /reveal\s+(your\s+)?(system\s+prompt|instructions|secret|api\s*key|password)/i,
    /(drop|alter|delete|truncate|insert|update|grant|revoke)\s+table/i,
    /delete\s+from/i,
    /update\s+[a-z_0-9]+\s+set/i,
    /insert\s+into/i,
    /exec(ute)?\s*\(/i,
    /<script/i,
    /--\s*system/i,
    /union\s+all\s+select/i,
    /pg_shadow|pg_authid|pg_user/i,
  ];

  /**
   * Analyzes natural language query, validates security boundaries, and routes intent.
   */
  analyze(prompt: string): AnalyzedIntent {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new BadRequestException('A valid, non-empty natural language prompt is required.');
    }

    const trimmed = prompt.trim();
    if (trimmed.length > 500) {
      throw new BadRequestException('Prompt exceeds maximum permitted character length (500).');
    }

    // 1. Prompt Injection Defense
    for (const pattern of this.adversarialPatterns) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Prompt injection pattern detected in prompt: "${trimmed}"`);
        return {
          category: 'general',
          primaryMetric: 'unknown',
          tables: [],
          suggestedChartType: 'table',
          confidence: 0,
          isSafe: false,
          securityNotes: 'Adversarial instruction or destructive SQL keyword detected. Query blocked by Intent Security Guard.',
        };
      }
    }

    const lower = trimmed.toLowerCase();

    // 2. Identify Table Mentions
    const tables: Set<string> = new Set();
    if (/(customer|user|client|country|who|buyer|spender|account|headquarter)/i.test(lower)) {
      tables.add('users');
    }
    if (/(product|category|item|tier|offering|sku|license|copilot|streamer|sentinel|platform)/i.test(lower)) {
      tables.add('products');
    }
    if (/(order|revenue|spent|spending|sale|sales|amount|dollar|transaction|purchase|bought|status|completed|pending|cancelled|refund)/i.test(lower)) {
      tables.add('orders');
    }

    // If no explicit table identified, include core analytical relation
    if (tables.size === 0) {
      tables.add('orders');
      tables.add('products');
      tables.add('users');
    } else if (tables.has('users') && tables.has('products')) {
      // Joining users and products requires orders table
      tables.add('orders');
    }

    // 3. Detect Intent Category
    let category: QueryIntentCategory = 'aggregation';
    let suggestedChart: 'bar' | 'line' | 'pie' | 'area' | 'table' = 'bar';

    if (/(trend|monthly|month|over time|history|timeline|growth|by day|by week)/i.test(lower)) {
      category = 'time_trend';
      suggestedChart = 'line';
    } else if (/(top|highest|most|best|bottom|lowest|rank|leader)/i.test(lower)) {
      category = 'ranking';
      suggestedChart = 'bar';
    } else if (/(compare|comparison|versus|vs|breakdown|distribution|share|proportion)/i.test(lower)) {
      category = 'comparison';
      suggestedChart = /(share|proportion|percent|distribution)/i.test(lower) ? 'pie' : 'bar';
    } else if (/(find|list|show all|which orders|filter|where)/i.test(lower) && !/(total|sum|average|avg)/i.test(lower)) {
      category = 'filtering';
      suggestedChart = 'table';
    } else {
      category = 'aggregation';
      suggestedChart = 'bar';
    }

    // 4. Primary Metric
    let primaryMetric = 'revenue';
    if (/(order count|number of orders|how many orders|orders count|frequency)/i.test(lower)) {
      primaryMetric = 'order_count';
    } else if (/(average|avg|aov)/i.test(lower)) {
      primaryMetric = 'average_amount';
    } else if (/(price|cost)/i.test(lower)) {
      primaryMetric = 'price';
    }

    // 5. Time dimension
    let timeDimension: string | undefined;
    if (/(this month|current month|october)/i.test(lower)) {
      timeDimension = 'current_month';
    } else if (/(monthly|by month)/i.test(lower)) {
      timeDimension = 'monthly';
    }

    // 6. Status filter
    let statusFilter: string | undefined;
    if (/completed/i.test(lower)) statusFilter = 'completed';
    else if (/pending/i.test(lower)) statusFilter = 'pending';
    else if (/cancelled/i.test(lower)) statusFilter = 'cancelled';
    else if (/refunded/i.test(lower)) statusFilter = 'refunded';

    return {
      category,
      primaryMetric,
      tables: Array.from(tables),
      timeDimension,
      statusFilter,
      suggestedChartType: suggestedChart,
      confidence: 0.95,
      isSafe: true,
    };
  }
}
