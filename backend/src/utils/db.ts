// ============================================================================
// Database Query Helpers
// ============================================================================

import { db } from '../services/database.js';
import type { QueryResult, QueryResultRow } from 'pg';

/**
 * Execute a SQL query with parameters
 */
export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return db.client.query<T>(sql, params);
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryAll<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await query<T>(sql, params);
  return result.rows;
}

/**
 * Execute a query and return the count
 */
export async function queryCount(
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const result = await query<{ count: string }>(sql, params);
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Build a WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, unknown>,
  startIndex = 1
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let index = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = $${index}`);
      params.push(value);
      index++;
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

/**
 * Build pagination clause
 */
export function buildPaginationClause(
  page: number = 1,
  limit: number = 20
): { clause: string; offset: number } {
  const offset = (page - 1) * limit;
  return {
    clause: `LIMIT ${limit} OFFSET ${offset}`,
    offset,
  };
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result as T;
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}
