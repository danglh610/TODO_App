/**
 * Base API Client
 * Handles HTTP requests with proper error handling and type safety
 */

import type { ApiErrorResponse } from '../types/duty';
import { API_CONFIG } from '../config/api';

// ============================================
// Configuration
// ============================================

// API base URL from configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// ============================================
// Custom Error Types
// ============================================

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: string[];

  constructor(message: string, status: number = 500, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error - please check your connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

// ============================================
// HTTP Methods
// ============================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestConfig {
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Base request function with error handling
 */
async function request<T>(endpoint: string, config: RequestConfig): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // Request options
  const options: RequestInit = {
    method: config.method,
    headers,
  };

  // Add body for non-GET requests
  if (config.body && config.method !== 'GET') {
    options.body = JSON.stringify(config.body);
  }

  try {
    // Make the request
    const response = await fetch(url, options);

    // Parse response
    const data = await response.json() as ApiErrorResponse;

    // Check if request was successful
    if (!response.ok || !data.success) {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.errors
      );
    }

    return data as T;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        searchParams.append(key, value ? 'true' : 'false');
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================
// Exported API Methods
// ============================================

export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params ? buildQueryString(params) : '';
    return request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'POST', body });
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, { method: 'PUT', body });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

// Export configuration for testing
export { API_BASE_URL };
