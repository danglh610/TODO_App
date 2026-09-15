/**
 * API Client Unit Tests
 */

import { ApiError, NetworkError, apiClient } from '../services/apiClient';

// ============================================
// Mock global fetch
// ============================================

const mockFetch = jest.fn();

// @ts-expect-error - Jest mock
globalThis.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiClient.get', () => {
    it('should make GET request with query params', async () => {
      const mockData = {
        success: true,
        data: [{ id: 1, title: 'Test Duty' }],
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get('/duties', { page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties?page=1&limit=10',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('should make GET request without params', async () => {
      const mockData = { success: true, data: [] };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      await apiClient.get('/duties');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should throw ApiError on non-2xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          message: 'Not found',
        }),
      });

      await expect(apiClient.get('/duties/999')).rejects.toThrow(ApiError);
    });

    it('should handle boolean query params correctly', async () => {
      const mockData = { success: true, data: [] };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      await apiClient.get('/duties', { completed: true });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties?completed=true',
        expect.any(Object)
      );
    });
  });

  describe('apiClient.post', () => {
    it('should make POST request with body', async () => {
      const mockData = {
        success: true,
        data: { id: 1, title: 'New Duty' },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.post('/duties', { title: 'New Duty' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'New Duty' }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should throw ApiError on validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          message: 'Title is required',
        }),
      });

      await expect(apiClient.post('/duties', {})).rejects.toThrow(ApiError);
    });
  });

  describe('apiClient.put', () => {
    it('should make PUT request with body', async () => {
      const mockData = {
        success: true,
        data: { id: 1, title: 'Updated Duty' },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.put('/duties/1', { title: 'Updated Duty' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated Duty' }),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('apiClient.delete', () => {
    it('should make DELETE request', async () => {
      const mockData = {
        success: true,
        message: 'Duty deleted successfully',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.delete('/duties/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/duties/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    it('should throw NetworkError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/duties')).rejects.toThrow(NetworkError);
    });

    it('should include status code in ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          message: 'Internal server error',
        }),
      });

      try {
        await apiClient.get('/duties');
        fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).message).toBe('Internal server error');
      }
    });
  });
});
