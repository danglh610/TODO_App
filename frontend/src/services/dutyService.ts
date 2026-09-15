/**
 * Duty Service
 * API client methods for duty CRUD operations
 */

import { apiClient, ApiError, NetworkError } from './apiClient';
import type {
  Duty,
  CreateDutyInput,
  UpdateDutyInput,
  DutyQueryParams,
  ApiResponse,
  PaginatedResponse,
  ServiceResult,
  PaginatedResult,
} from '../types/duty';

// ============================================
// Duty API Service
// ============================================

/**
 * Convert API response to ServiceResult
 */
function toServiceResult<T>(
  success: boolean,
  data: T | undefined,
  error?: string
): ServiceResult<T> {
  return { success, data, error };
}

/**
 * Convert paginated API response to PaginatedResult
 */
function toPaginatedResult<T>(
  response: PaginatedResponse<T>
): PaginatedResult<T> {
  return {
    success: response.success,
    data: response.data || [],
    total: response.total || 0,
    page: response.page || 1,
    totalPages: response.total_pages || 1,
  };
}

// ============================================
// Duty API Service
// ============================================

export const dutyService = {
  // ============================================
  // GET /api/duties - List duties (paginated & filtered)
  // ============================================
  
  /**
   * Get paginated list of duties with optional filters
   * @param params - Query parameters for filtering, sorting, pagination
   * @returns PaginatedResult with duties array
   */
  async getDuties(params?: DutyQueryParams): Promise<PaginatedResult<Duty>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Duty>>(
        '/duties',
        params as Record<string, unknown>
      );
      return toPaginatedResult(response);
    } catch (error) {
      if (error instanceof NetworkError) {
        return toServiceResult(false, undefined, error.message) as PaginatedResult<Duty>;
      }
      if (error instanceof ApiError) {
        return toServiceResult(false, undefined, error.message) as PaginatedResult<Duty>;
      }
      return toServiceResult(false, undefined, 'An unexpected error occurred') as PaginatedResult<Duty>;
    }
  },

  // ============================================
  // GET /api/duties/:id - Get single duty
  // ============================================
  
  /**
   * Get a single duty by ID
   * @param id - Duty ID
   * @returns ServiceResult with duty data
   */
  async getDutyById(id: number): Promise<ServiceResult<Duty>> {
    try {
      const response = await apiClient.get<ApiResponse<Duty>>(`/duties/${id}`);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, data: undefined, error: response.message || 'Duty not found' };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { success: false, data: undefined, error: `Duty with ID ${id} not found` };
        }
        return { success: false, data: undefined, error: error.message };
      }
      if (error instanceof NetworkError) {
        return { success: false, data: undefined, error: error.message };
      }
      return { success: false, data: undefined, error: 'An unexpected error occurred' };
    }
  },

  // ============================================
  // POST /api/duties - Create new duty
  // ============================================
  
  /**
   * Create a new duty
   * @param input - CreateDutyInput with title and optional fields
   * @returns ServiceResult with created duty
   */
  async createDuty(input: CreateDutyInput): Promise<ServiceResult<Duty>> {
    try {
      // Validate input
      const validationError = validateCreateInput(input);
      if (validationError) {
        return { success: false, data: undefined, error: validationError };
      }

      const response = await apiClient.post<ApiResponse<Duty>>('/duties', input);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, data: undefined, error: response.message || 'Failed to create duty' };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, data: undefined, error: error.message };
      }
      if (error instanceof NetworkError) {
        return { success: false, data: undefined, error: error.message };
      }
      return { success: false, data: undefined, error: 'An unexpected error occurred' };
    }
  },

  // ============================================
  // PUT /api/duties/:id - Update duty
  // ============================================
  
  /**
   * Update an existing duty
   * @param id - Duty ID to update
   * @param input - UpdateDutyInput with fields to update
   * @returns ServiceResult with updated duty
   */
  async updateDuty(id: number, input: UpdateDutyInput): Promise<ServiceResult<Duty>> {
    try {
      // Validate input
      const validationError = validateUpdateInput(input);
      if (validationError) {
        return { success: false, data: undefined, error: validationError };
      }

      const response = await apiClient.put<ApiResponse<Duty>>(`/duties/${id}`, input);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, data: undefined, error: response.message || 'Failed to update duty' };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { success: false, data: undefined, error: `Duty with ID ${id} not found` };
        }
        return { success: false, data: undefined, error: error.message };
      }
      if (error instanceof NetworkError) {
        return { success: false, data: undefined, error: error.message };
      }
      return { success: false, data: undefined, error: 'An unexpected error occurred' };
    }
  },

  // ============================================
  // DELETE /api/duties/:id - Soft delete duty
  // ============================================
  
  /**
   * Soft delete a duty (marks as deleted)
   * @param id - Duty ID to delete
   * @returns ServiceResult indicating success/failure
   */
  async deleteDuty(id: number): Promise<ServiceResult<null>> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/duties/${id}`);
      if (response.success) {
        return { success: true, data: null };
      }
      return { success: false, data: null, error: response.message || 'Failed to delete duty' };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { success: false, data: null, error: `Duty with ID ${id} not found` };
        }
        return { success: false, data: null, error: error.message };
      }
      if (error instanceof NetworkError) {
        return { success: false, data: null, error: error.message };
      }
      return { success: false, data: null, error: 'An unexpected error occurred' };
    }
  },
};

// ============================================
// Validation Functions
// ============================================

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const MAX_TITLE_LENGTH = 255;

function validateCreateInput(input: CreateDutyInput): string | undefined {
  // Title is required
  if (!input.title || typeof input.title !== 'string') {
    return 'Title is required';
  }

  // Title cannot be empty
  if (input.title.trim().length === 0) {
    return 'Title cannot be empty';
  }

  // Title max length
  if (input.title.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or less`;
  }

  // Validate status if provided
  if (input.status !== undefined) {
    if (!VALID_STATUSES.includes(input.status)) {
      return `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
  }

  // Validate priority if provided
  if (input.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(input.priority)) {
      return `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
    }
  }

  // Validate date formats if provided
  if (input.start_date && !isValidDateFormat(input.start_date)) {
    return 'Start date must be in YYYY-MM-DD format';
  }

  if (input.end_date && !isValidDateFormat(input.end_date)) {
    return 'End date must be in YYYY-MM-DD format';
  }

  return undefined; // No validation errors
}

function validateUpdateInput(input: UpdateDutyInput): string | undefined {
  // At least one field must be provided
  const hasField = 
    input.title !== undefined ||
    input.description !== undefined ||
    input.status !== undefined ||
    input.priority !== undefined ||
    input.start_date !== undefined ||
    input.end_date !== undefined ||
    input.notes !== undefined ||
    input.completed !== undefined;

  if (!hasField) {
    return 'At least one field must be provided for update';
  }

  // Validate title if provided
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      return 'Title must be a non-empty string';
    }
    if (input.title.length > MAX_TITLE_LENGTH) {
      return `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }
  }

  // Validate status if provided
  if (input.status !== undefined) {
    if (!VALID_STATUSES.includes(input.status)) {
      return `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
  }

  // Validate priority if provided
  if (input.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(input.priority)) {
      return `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
    }
  }

  // Validate dates if provided (can be null)
  if (input.start_date !== undefined && input.start_date !== null) {
    if (!isValidDateFormat(input.start_date)) {
      return 'Start date must be in YYYY-MM-DD format';
    }
  }

  if (input.end_date !== undefined && input.end_date !== null) {
    if (!isValidDateFormat(input.end_date)) {
      return 'End date must be in YYYY-MM-DD format';
    }
  }

  // Validate completed if provided
  if (input.completed !== undefined && typeof input.completed !== 'boolean') {
    return 'Completed must be a boolean';
  }

  return undefined; // No validation errors
}

function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

// ============================================
// Export types for use in components
// ============================================

export type { CreateDutyInput, UpdateDutyInput, DutyQueryParams };
