/**
 * Services Index
 * Export all API services for use in components
 */

// API Client
export { apiClient, ApiError, NetworkError, API_BASE_URL } from './apiClient';

// Duty Service
export { dutyService } from './dutyService';
export type {
  CreateDutyInput,
  UpdateDutyInput,
  DutyQueryParams,
} from './dutyService';

// Re-export types for convenience
export type { ApiResponse, PaginatedResponse } from '../types/duty';
