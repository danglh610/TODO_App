// src/types/duty.ts
// Duty entity type definitions

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

// Query parameters for listing duties
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
