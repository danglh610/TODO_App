// src/routes/duties.routes.ts
// Duty routes - handles HTTP requests for duty endpoints

import { Router, Request, Response, NextFunction } from 'express';
import * as dutiesService from '../services/duties.service';
import type { CreateDutyInput, UpdateDutyInput, DutyQueryParams, DutyStatus, DutyPriority } from '../types/duty';

const router = Router();

// Valid enum values
const VALID_STATUSES: DutyStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
const VALID_PRIORITIES: DutyPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'priority', 'due_date'] as const;

/**
 * Parse query parameters for list endpoint
 */
function parseQueryParams(query: Request['query']): { valid: boolean; params?: DutyQueryParams; error?: string } {
  const params: DutyQueryParams = {};

  // Parse pagination
  if (query.page !== undefined) {
    const page = parseInt(String(query.page), 10);
    if (isNaN(page) || page < 1) {
      return { valid: false, error: 'page must be a positive integer' };
    }
    params.page = page;
  }

  if (query.limit !== undefined) {
    const limit = parseInt(String(query.limit), 10);
    if (isNaN(limit) || limit < 1) {
      return { valid: false, error: 'limit must be a positive integer' };
    }
    params.limit = limit;
  }

  // Parse status filter
  if (query.status !== undefined) {
    const status = String(query.status) as DutyStatus;
    if (!VALID_STATUSES.includes(status)) {
      return { valid: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` };
    }
    params.status = status;
  }

  // Parse priority filter
  if (query.priority !== undefined) {
    const priority = String(query.priority) as DutyPriority;
    if (!VALID_PRIORITIES.includes(priority)) {
      return { valid: false, error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
    }
    params.priority = priority;
  }

  // Parse completed filter
  if (query.completed !== undefined) {
    const completed = String(query.completed).toLowerCase();
    if (completed === 'true' || completed === '1') {
      params.completed = true;
    } else if (completed === 'false' || completed === '0') {
      params.completed = false;
    } else {
      return { valid: false, error: 'completed must be true/false or 1/0' };
    }
  }

  // Parse search query
  if (query.search !== undefined) {
    const search = String(query.search).trim();
    if (search.length > 0) {
      params.search = search;
    }
  }

  // Parse sort field
  if (query.sort_by !== undefined) {
    const sortBy = String(query.sort_by).toLowerCase();
    if (!VALID_SORT_FIELDS.includes(sortBy as typeof VALID_SORT_FIELDS[number])) {
      return { valid: false, error: `sort_by must be one of: ${VALID_SORT_FIELDS.join(', ')}` };
    }
    params.sort_by = sortBy as DutyQueryParams['sort_by'];
  }

  // Parse sort order
  if (query.sort_order !== undefined) {
    const sortOrder = String(query.sort_order).toLowerCase();
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return { valid: false, error: 'sort_order must be asc or desc' };
    }
    params.sort_order = sortOrder as 'asc' | 'desc';
  }

  return { valid: true, params };
}

/**
 * Validate CreateDutyInput
 */
function validateCreateInput(body: unknown): { valid: boolean; error?: string; data?: CreateDutyInput } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { title, description, status, priority, start_date, end_date, notes } = body as Record<string, unknown>;

  // Title is required
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title is required and must be a string' };
  }

  // Title max length validation
  if (title.length > 255) {
    return { valid: false, error: 'Title must be 255 characters or less' };
  }

  // Validate optional status
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status as DutyStatus)) {
      return { valid: false, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
    }
  }

  // Validate optional priority
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority as DutyPriority)) {
      return { valid: false, error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
    }
  }

  // Validate date formats if provided
  const dateFields = ['start_date', 'end_date'];
  for (const field of dateFields) {
    const value = (body as Record<string, unknown>)[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        return { valid: false, error: `${field} must be a date string (YYYY-MM-DD)` };
      }
      // Basic date format validation (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { valid: false, error: `${field} must be in YYYY-MM-DD format` };
      }
    }
  }

  return {
    valid: true,
    data: {
      title: title.trim(),
      description: description as string | undefined,
      status: status as CreateDutyInput['status'],
      priority: priority as CreateDutyInput['priority'],
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      notes: notes as string | undefined
    }
  };
}

/**
 * Validate UpdateDutyInput
 */
function validateUpdateInput(body: unknown): { valid: boolean; error?: string; data?: UpdateDutyInput } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // At least one field must be provided
  const allowedFields = ['title', 'description', 'status', 'priority', 'start_date', 'end_date', 'notes', 'completed'];
  const hasValidField = allowedFields.some(field => field in data);
  
  if (!hasValidField) {
    return { valid: false, error: 'At least one field must be provided for update' };
  }

  const result: UpdateDutyInput = {};

  // Validate title if provided
  if ('title' in data) {
    if (typeof data.title !== 'string' || data.title.length === 0) {
      return { valid: false, error: 'Title must be a non-empty string' };
    }
    if (data.title.length > 255) {
      return { valid: false, error: 'Title must be 255 characters or less' };
    }
    result.title = data.title.trim();
  }

  // Validate description if provided (can be null to clear)
  if ('description' in data) {
    result.description = data.description === null ? null : (data.description as string | undefined);
  }

  // Validate status if provided
  if ('status' in data) {
    if (!VALID_STATUSES.includes(data.status as DutyStatus)) {
      return { valid: false, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
    }
    result.status = data.status as UpdateDutyInput['status'];
  }

  // Validate priority if provided
  if ('priority' in data) {
    if (!VALID_PRIORITIES.includes(data.priority as DutyPriority)) {
      return { valid: false, error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
    }
    result.priority = data.priority as UpdateDutyInput['priority'];
  }

  // Validate dates if provided
  const dateFields = ['start_date', 'end_date'] as const;
  for (const field of dateFields) {
    if (field in data) {
      if (data[field] !== null && typeof data[field] !== 'string') {
        return { valid: false, error: `${field} must be a date string (YYYY-MM-DD) or null` };
      }
      if (data[field] !== null && data[field] !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data[field] as string)) {
          return { valid: false, error: `${field} must be in YYYY-MM-DD format` };
        }
      }
      result[field] = data[field] as UpdateDutyInput[typeof field];
    }
  }

  // Validate notes if provided
  if ('notes' in data) {
    result.notes = data.notes === null ? null : (data.notes as string | undefined);
  }

  // Validate completed if provided
  if ('completed' in data) {
    if (typeof data.completed !== 'boolean') {
      return { valid: false, error: 'Completed must be a boolean' };
    }
    result.completed = data.completed;
  }

  return { valid: true, data: result };
}

/**
 * Parse ID from request params
 */
function parseId(param: string): { valid: boolean; id?: number; error?: string } {
  const parsed = parseInt(param, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid ID: must be a positive integer' };
  }
  return { valid: true, id: parsed };
}

// ============================================
// GET /api/duties - Get paginated and filtered duties
// ============================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse query parameters
    const queryResult = parseQueryParams(req.query);
    if (!queryResult.valid) {
      res.status(400).json({
        success: false,
        error: queryResult.error
      });
      return;
    }

    console.log('[Route] GET /api/duties', req.query);
    const result = await dutiesService.getDuties(queryResult.params!);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/duties/:id - Get a single duty
// ============================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id as string;
    const idCheck = parseId(idParam);
    if (!idCheck.valid) {
      res.status(400).json({
        success: false,
        error: idCheck.error
      });
      return;
    }

    console.log(`[Route] GET /api/duties/${idCheck.id}`);
    const duty = await dutiesService.getDutyById(idCheck.id!);

    if (!duty) {
      res.status(404).json({
        success: false,
        error: `Duty with ID ${idCheck.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: duty
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/duties - Create a new duty
// ============================================
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateCreateInput(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    console.log('[Route] POST /api/duties');
    const duty = await dutiesService.createDuty(validation.data!);

    res.status(201).json({
      success: true,
      data: duty,
      message: 'Duty created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PUT /api/duties/:id - Update an existing duty
// ============================================
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id as string;
    const idCheck = parseId(idParam);
    if (!idCheck.valid) {
      res.status(400).json({
        success: false,
        error: idCheck.error
      });
      return;
    }

    const validation = validateUpdateInput(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    console.log(`[Route] PUT /api/duties/${idCheck.id}`);
    const duty = await dutiesService.updateDuty(idCheck.id!, validation.data!);

    if (!duty) {
      res.status(404).json({
        success: false,
        error: `Duty with ID ${idCheck.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: duty,
      message: 'Duty updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE /api/duties/:id - Soft delete a duty
// ============================================
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idParam = req.params.id as string;
    const idCheck = parseId(idParam);
    if (!idCheck.valid) {
      res.status(400).json({
        success: false,
        error: idCheck.error
      });
      return;
    }

    console.log(`[Route] DELETE /api/duties/${idCheck.id}`);
    const deleted = await dutiesService.deleteDuty(idCheck.id!);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Duty with ID ${idCheck.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      message: `Duty with ID ${idCheck.id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
