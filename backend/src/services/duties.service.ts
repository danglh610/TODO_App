// src/services/duties.service.ts
// Duty service - handles all database operations for duties

import { query } from '../db/connection';
import type {
  Duty,
  CreateDutyInput,
  UpdateDutyInput,
  DutyQueryParams,
  PaginatedResponse
} from '../types/duty';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Get paginated and filtered duties
 * @param params - Query parameters for pagination and filtering
 * @returns Paginated response with duties
 */
export async function getDuties(params: DutyQueryParams): Promise<PaginatedResponse<Duty>> {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    status,
    priority,
    completed,
    search,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = params;

  // Validate and normalize pagination
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));
  const offset = (safePage - 1) * safeLimit;

  // Build WHERE clause dynamically
  const conditions: string[] = ['deleted_at IS NULL'];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Filter by status
  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  // Filter by priority
  if (priority) {
    conditions.push(`priority = $${paramIndex++}`);
    values.push(priority);
  }

  // Filter by completed
  if (completed !== undefined) {
    conditions.push(`completed = $${paramIndex++}`);
    values.push(completed);
  }

  // Search in title and description
  if (search) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Build ORDER BY clause
  let orderClause: string;
  const safeSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  switch (sort_by) {
    case 'priority':
      // Custom priority ordering
      orderClause = `(CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END) ${safeSortOrder}`;
      break;
    case 'due_date':
      orderClause = `end_date ${safeSortOrder} NULLS LAST`;
      break;
    case 'updated_at':
      orderClause = `updated_at ${safeSortOrder}`;
      break;
    case 'created_at':
    default:
      orderClause = `created_at ${safeSortOrder}`;
      break;
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM duties WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(total / safeLimit);

  // Get paginated data
  const dataResult = await query<Duty>(
    `SELECT 
      id,
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes,
      completed,
      completed_at,
      deleted_at,
      created_at,
      updated_at
    FROM duties
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, safeLimit, offset]
  );

  return {
    success: true,
    data: dataResult.rows,
    total,
    page: safePage,
    limit: safeLimit,
    total_pages: totalPages
  };
}

/**
 * Get all duties (legacy - kept for backward compatibility)
 * @returns Array of all active duties
 */
export async function getAllDuties(): Promise<Duty[]> {
  const result = await query<Duty>(`
    SELECT 
      id,
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes,
      completed,
      completed_at,
      deleted_at,
      created_at,
      updated_at
    FROM duties
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);
  return result.rows;
}

/**
 * Get a single duty by ID
 * @param id - Duty ID
 * @returns Duty if found, null otherwise
 */
export async function getDutyById(id: number): Promise<Duty | null> {
  const result = await query<Duty>(`
    SELECT 
      id,
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes,
      completed,
      completed_at,
      deleted_at,
      created_at,
      updated_at
    FROM duties
    WHERE id = $1 AND deleted_at IS NULL
  `, [id]);
  
  return result.rows[0] || null;
}

/**
 * Create a new duty
 * @param input - Duty creation input
 * @returns Created duty
 */
export async function createDuty(input: CreateDutyInput): Promise<Duty> {
  const { title, description, status, priority, start_date, end_date, notes } = input;
  
  const result = await query<Duty>(`
    INSERT INTO duties (
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
      id,
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes,
      completed,
      completed_at,
      deleted_at,
      created_at,
      updated_at
  `, [
    title,
    description || null,
    status || 'pending',
    priority || 'medium',
    start_date || null,
    end_date || null,
    notes || null
  ]);
  
  console.log(`[Service] Created duty with ID: ${result.rows[0].id}`);
  return result.rows[0];
}

/**
 * Update an existing duty
 * @param id - Duty ID
 * @param input - Update input
 * @returns Updated duty if found, null otherwise
 */
export async function updateDuty(id: number, input: UpdateDutyInput): Promise<Duty | null> {
  // Build dynamic update query
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }
  if (input.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`);
    values.push(input.priority);
  }
  if (input.start_date !== undefined) {
    updates.push(`start_date = $${paramIndex++}`);
    values.push(input.start_date);
  }
  if (input.end_date !== undefined) {
    updates.push(`end_date = $${paramIndex++}`);
    values.push(input.end_date);
  }
  if (input.notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(input.notes);
  }
  if (input.completed !== undefined) {
    updates.push(`completed = $${paramIndex++}`);
    values.push(input.completed);
    // Auto-set completed_at timestamp
    updates.push(`completed_at = $${paramIndex++}`);
    values.push(input.completed ? 'CURRENT_TIMESTAMP' : null);
  }

  // Always update updated_at
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add WHERE clause parameter
  values.push(id);

  const result = await query<Duty>(`
    UPDATE duties
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex} AND deleted_at IS NULL
    RETURNING 
      id,
      title,
      description,
      status,
      priority,
      start_date,
      end_date,
      notes,
      completed,
      completed_at,
      deleted_at,
      created_at,
      updated_at
  `, values);

  if (result.rows[0]) {
    console.log(`[Service] Updated duty ID: ${id}`);
  }
  return result.rows[0] || null;
}

/**
 * Soft delete a duty (sets deleted_at timestamp)
 * @param id - Duty ID
 * @returns true if deleted, false if not found
 */
export async function deleteDuty(id: number): Promise<boolean> {
  const result = await query(`
    UPDATE duties
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
  `, [id]);

  const deleted = result.rowCount !== null && result.rowCount > 0;
  if (deleted) {
    console.log(`[Service] Soft deleted duty ID: ${id}`);
  }
  return deleted;
}
