/**
 * Frontend TypeScript type definitions
 * Matched with backend types for type-safe API communication
 */

// ============================================
// Core Duty Types
// ============================================

export interface Duty {
  id: number;
  title: string;
  description: string | null;
  status: DutyStatus;
  priority: DutyPriority;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DutyStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type DutyPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================
// API Input/Output Types
// ============================================

export interface CreateDutyInput {
  title: string;
  description?: string;
  status?: DutyStatus;
  priority?: DutyPriority;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface UpdateDutyInput {
  title?: string;
  description?: string | null;
  status?: DutyStatus;
  priority?: DutyPriority;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  completed?: boolean;
}

export interface DutyQueryParams {
  page?: number;
  limit?: number;
  status?: DutyStatus;
  priority?: DutyPriority;
  completed?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'due_date';
  sort_order?: 'asc' | 'desc';
}

// ============================================
// API Response Types
// ============================================

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// Service Result Types (for use in components)
// ============================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}
