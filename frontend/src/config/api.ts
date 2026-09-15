/**
 * API Configuration
 * Centralized configuration for API client
 */

// Default API base URL
const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

/**
 * Get API base URL from environment
 * Supports both Vite (browser) and Node.js (test) environments
 */
function getApiBaseUrl(): string {
  // Try Vite environment variable first (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to environment variable (Node.js)
  const envUrl = process.env.VITE_API_BASE_URL || process.env.REACT_APP_API_URL;
  return envUrl || DEFAULT_API_BASE_URL;
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
};

export { DEFAULT_API_BASE_URL };
