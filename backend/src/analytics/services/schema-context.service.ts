import { Injectable } from '@nestjs/common';

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  description: string;
  sampleValues?: string[];
}

export interface TableDefinition {
  name: string;
  displayName: string;
  description: string;
  columns: ColumnDefinition[];
  relationships: string[];
}

export interface DatabaseSchemaMetadata {
  tables: TableDefinition[];
  businessRules: string[];
}

@Injectable()
export class SchemaContextService {
  private readonly schema: DatabaseSchemaMetadata = {
    tables: [
      {
        name: 'users',
        displayName: 'Customers & Users',
        description: 'B2B enterprise customer accounts and user profiles.',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Unique user identifier' },
          { name: 'name', type: 'TEXT', description: 'Full customer / account name', sampleValues: ['Sarah Connor', 'Liam Davies', 'Elena Rostova'] },
          { name: 'email', type: 'TEXT', description: 'Corporate contact email address', sampleValues: ['sarah.c@cyberdyne.io', 'liam.d@meridian.uk'] },
          { name: 'country', type: 'TEXT', description: 'Country of customer headquarters', sampleValues: ['United States', 'Germany', 'Japan', 'United Kingdom'] },
          { name: 'created_at', type: 'TIMESTAMP', description: 'Account creation timestamp' },
        ],
        relationships: [
          'users.id has many orders via orders.user_id',
        ],
      },
      {
        name: 'products',
        displayName: 'Products & Offerings',
        description: 'Catalog of SaaS products, enterprise tiers, and AI modules.',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Unique product identifier' },
          { name: 'title', type: 'TEXT', description: 'Product title / SKU name', sampleValues: ['Enterprise Cloud Platform', 'AI Predictive Copilot', 'Data Warehouse Pipeline'] },
          { name: 'category', type: 'TEXT', description: 'Product category classification', sampleValues: ['Infrastructure', 'AI & ML', 'Analytics', 'Security'] },
          { name: 'price', type: 'DECIMAL(10,2)', description: 'Catalog list price in USD', sampleValues: ['2499.00', '1299.00', '850.00'] },
          { name: 'created_at', type: 'TIMESTAMP', description: 'Product catalog release timestamp' },
        ],
        relationships: [
          'products.id has many orders via orders.product_id',
        ],
      },
      {
        name: 'orders',
        displayName: 'Orders & Financial Transactions',
        description: 'B2B subscription orders, invoicing amounts, and transaction fulfillment states.',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Unique order identifier' },
          { name: 'user_id', type: 'INTEGER', isForeign: true, references: 'users(id)', description: 'Customer ID who placed the order' },
          { name: 'product_id', type: 'INTEGER', isForeign: true, references: 'products(id)', description: 'Product ID purchased' },
          { name: 'amount', type: 'DECIMAL(10,2)', description: 'Total transaction amount charged in USD' },
          { name: 'status', type: 'TEXT', description: 'Fulfillment status (completed, pending, cancelled, refunded)', sampleValues: ['completed', 'pending', 'cancelled', 'refunded'] },
          { name: 'created_at', type: 'TIMESTAMP', description: 'Order placement timestamp' },
        ],
        relationships: [
          'orders.user_id references users.id',
          'orders.product_id references products.id',
        ],
      },
    ],
    businessRules: [
      "Revenue Definition: Revenue is computed as SUM(orders.amount) WHERE orders.status = 'completed'. Never count cancelled or refunded orders in net revenue unless the user query explicitly requests transaction volume by status.",
      "Customer Metrics: Top spending customers must be ranked by SUM(orders.amount) with orders.status = 'completed'.",
      "Time Dimensions: For monthly trends, use TO_CHAR(orders.created_at, 'YYYY-MM') or DATE_TRUNC('month', orders.created_at) AS month.",
      "Naming & Aliasing: Provide intuitive lowercase snake_case aliases such as total_revenue, customer_name, product_title, order_count, month.",
      "Query Boundary: Only use tables 'users', 'products', and 'orders'. Never reference administrative or system catalogs.",
    ],
  };

  /**
   * Returns schema metadata for API response / UI visualization
   */
  getSchemaMetadata(): DatabaseSchemaMetadata {
    return this.schema;
  }

  /**
   * Vectorless retrieval: constructs concise relational schema context for LLM prompt
   */
  buildPromptContext(tablesRequested?: string[]): string {
    const relevantTables = tablesRequested && tablesRequested.length > 0
      ? this.schema.tables.filter((t) => tablesRequested.includes(t.name))
      : this.schema.tables;

    const tableSnippets = relevantTables.map((tbl) => {
      const colList = tbl.columns
        .map((c) => `  - ${c.name} (${c.type}): ${c.description}${c.references ? ` -> FK to ${c.references}` : ''}`)
        .join('\n');
      return `TABLE: public.${tbl.name} (${tbl.displayName})\nDescription: ${tbl.description}\nColumns:\n${colList}\nRelationships:\n${tbl.relationships.map((r) => `  * ${r}`).join('\n')}`;
    });

    const rulesSnippet = this.schema.businessRules
      .map((r, i) => `${i + 1}. ${r}`)
      .join('\n');

    return `### DATABASE RELATIONAL SCHEMA (PostgreSQL):
${tableSnippets.join('\n\n')}

### CORE BUSINESS LOGIC & CALCULATION RULES:
${rulesSnippet}
`;
  }
}
