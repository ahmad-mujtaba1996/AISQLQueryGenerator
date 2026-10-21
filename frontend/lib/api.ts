import { QueryResponse, DatabaseSchema, HealthStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Executes natural language analytical query against DataPulse AI backend
 */
export async function runAnalyticsQuery(prompt: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorBody.message || `Query failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches approved database relational schema
 */
export async function getSchema(): Promise<DatabaseSchema> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/schema`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status}`);
  }

  return response.json();
}

/**
 * Checks backend health and database connection status
 */
export async function getHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}
