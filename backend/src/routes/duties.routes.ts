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

// ============================================
// GET /api/duties - Get paginated and filtered duties
// ============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse & validate query parameters
    const params: DutyQueryParams = {};
    const errors: string[] = [];

    // Parse page
    if (req.query.page !== undefined) {
      const page = parseInt(String(req.query.page), 10);
      if (isNaN(page) || page < 1) {
        errors.push('page must be a positive integer');
      } else {
        params.page = page;
      }
    }

    // Parse limit
    if (req.query.limit !== undefined) {
      const limit = parseInt(String(req.query.limit), 10);
      if (isNaN(limit) || limit < 1) {
        errors.push('limit must be a positive integer');
      } else {
        params.limit = limit;
      }
    }

    // Parse status filter
    if (req.query.status !== undefined) {
      const status = String(req.query.status) as DutyStatus;
      if (!VALID_STATUSES.includes(status)) {
        errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      } else {
        params.status = status;
      }
    }

    // Parse priority filter
    if (req.query.priority !== undefined) {
      const priority = String(req.query.priority) as DutyPriority;
      if (!VALID_PRIORITIES.includes(priority)) {
        errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      } else {
        params.priority = priority;
      }
    }

    // Parse completed filter
    if (req.query.completed !== undefined) {
      const completed = String(req.query.completed).toLowerCase();
      if (completed === 'true' || completed === '1') {
        params.completed = true;
      } else if (completed === 'false' || completed === '0') {
        params.completed = false;
      } else {
        errors.push('completed must be true/false or 1/0');
      }
    }

    // Parse search query
    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim();
      if (search.length > 0) {
        params.search = search;
      }
    }

    // Parse sort field
    if (req.query.sort_by !== undefined) {
      const sortBy = String(req.query.sort_by).toLowerCase();
      if (!VALID_SORT_FIELDS.includes(sortBy as typeof VALID_SORT_FIELDS[number])) {
        errors.push(`sort_by must be one of: ${VALID_SORT_FIELDS.join(', ')}`);
      } else {
        params.sort_by = sortBy as DutyQueryParams['sort_by'];
      }
    }

    // Parse sort order
    if (req.query.sort_order !== undefined) {
      const sortOrder = String(req.query.sort_order).toLowerCase();
      if (sortOrder !== 'asc' && sortOrder !== 'desc') {
        errors.push('sort_order must be asc or desc');
      } else {
        params.sort_order = sortOrder as 'asc' | 'desc';
      }
    }

    // Return validation errors directly
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
      return;
    }

    const result = await dutiesService.getDuties(params);
    res.json(result);
  } catch (error) {
    console.error('[Route] GET /api/duties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ============================================
// GET /api/duties/:id - Get a single duty
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Parse & validate ID
    const idParam = req.params.id as string;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID: must be a positive integer'
      });
      return;
    }

    const duty = await dutiesService.getDutyById(id);
    if (!duty) {
      res.status(404).json({
        success: false,
        message: `Duty with ID ${id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: duty
    });
  } catch (error) {
    console.error(`[Route] GET /api/duties/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ============================================
// POST /api/duties - Create a new duty
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = validateCreateInput(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.error
      });
      return;
    }

    const duty = await dutiesService.createDuty(validation.data!);
    res.status(201).json({
      success: true,
      data: duty,
      message: 'Duty created successfully'
    });
  } catch (error) {
    console.error('[Route] POST /api/duties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ============================================
// PUT /api/duties/:id - Update an existing duty
// ============================================
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // Parse & validate ID
    const idParam = req.params.id as string;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID: must be a positive integer'
      });
      return;
    }

    // Validate body
    const validation = validateUpdateInput(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.error
      });
      return;
    }

    const duty = await dutiesService.updateDuty(id, validation.data!);
    if (!duty) {
      res.status(404).json({
        success: false,
        message: `Duty with ID ${id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: duty,
      message: 'Duty updated successfully'
    });
  } catch (error) {
    console.error(`[Route] PUT /api/duties/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ============================================
// DELETE /api/duties/:id - Soft delete a duty
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Parse & validate ID
    const idParam = req.params.id as string;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID: must be a positive integer'
      });
      return;
    }

    const deleted = await dutiesService.deleteDuty(id);
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: `Duty with ID ${id} not found`
      });
      return;
    }

    res.json({
      success: true,
      message: `Duty with ID ${id} deleted successfully`
    });
  } catch (error) {
    console.error(`[Route] DELETE /api/duties/${req.params.id} error:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ============================================
// Validation helpers
// ============================================

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

  // Status is required
  if (!status) {
    return { valid: false, error: 'Status is required' };
  }
  if (!VALID_STATUSES.includes(status as DutyStatus)) {
    return { valid: false, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  // Priority is required
  if (!priority) {
    return { valid: false, error: 'Priority is required' };
  }
  if (!VALID_PRIORITIES.includes(priority as DutyPriority)) {
    return { valid: false, error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
  }

  // Validate date formats if provided
  const dateFields = ['start_date', 'end_date'];
  for (const field of dateFields) {
    const value = (body as Record<string, unknown>)[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        return { valid: false, error: `${field} must be a date string (YYYY-MM-DD)` };
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { valid: false, error: `${field} must be in YYYY-MM-DD format` };
      }
    }
  }

  // Validate date range (end_date >= start_date)
  if (start_date && end_date && typeof start_date === 'string' && typeof end_date === 'string') {
    if (end_date < start_date) {
      return { valid: false, error: 'End date must be on or after start date' };
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
    if (!data.status) {
      return { valid: false, error: 'Status is required' };
    }
    if (!VALID_STATUSES.includes(data.status as DutyStatus)) {
      return { valid: false, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
    }
    result.status = data.status as UpdateDutyInput['status'];
  }

  // Validate priority if provided
  if ('priority' in data) {
    if (!data.priority) {
      return { valid: false, error: 'Priority is required' };
    }
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

  // Validate date range (end_date >= start_date) if both are provided
  const startDateVal = 'start_date' in data ? data.start_date : undefined;
  const endDateVal = 'end_date' in data ? data.end_date : undefined;
  if (startDateVal && endDateVal && startDateVal !== null && endDateVal !== null) {
    if (typeof startDateVal === 'string' && typeof endDateVal === 'string') {
      if (endDateVal < startDateVal) {
        return { valid: false, error: 'End date must be on or after start date' };
      }
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

export default router;
