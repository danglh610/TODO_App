/**
 * Jest configuration for testing
 */

// Mock API config module
jest.mock('./config/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000/api',
  },
  DEFAULT_API_BASE_URL: 'http://localhost:3000/api',
}));

// Mock fetch
global.fetch = jest.fn();
