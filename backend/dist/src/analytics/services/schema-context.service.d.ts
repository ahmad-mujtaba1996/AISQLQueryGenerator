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
export declare class SchemaContextService {
    private readonly schema;
    getSchemaMetadata(): DatabaseSchemaMetadata;
    buildPromptContext(tablesRequested?: string[]): string;
}
