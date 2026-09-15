/**
 * API Configuration
 * Centralized configuration for API client
 */

// Default API base URL - use relative path for Vite proxy
const DEFAULT_API_BASE_URL = '/api';

/**
 * Get API base URL from environment
 * Only uses Vite environment variables (browser-safe)
 */
function getApiBaseUrl(): string {
  // Vite environment variable (browser-safe)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  
  // Default to relative path (works with Vite proxy)
  return DEFAULT_API_BASE_URL;
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
};

export { DEFAULT_API_BASE_URL };
