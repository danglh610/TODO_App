/**
 * Duty Service Unit Tests
 */

import { dutyService } from './dutyService';
import { apiClient, ApiError, NetworkError } from './apiClient';

// Mock apiClient
jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ApiError: class extends Error {
    status: number;
    constructor(message: string, status: number = 500) {
      super(message);
      this.status = status;
    }
  },
  NetworkError: class extends Error {
    constructor(message: string = 'Network error') {
      super(message);
    }
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('dutyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // getDuties
  // ============================================
  describe('getDuties', () => {
    it('should return paginated duties on success', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, title: 'Duty 1', status: 'pending', priority: 'medium', completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
        ],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await dutyService.getDuties({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValueOnce(new ApiError('Server error', 500));

      const result = await dutyService.getDuties();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  // ============================================
  // getDutyById
  // ============================================
  describe('getDutyById', () => {
    it('should return duty on success', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.get.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.getDutyById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDuty);
    });

    it('should return 404 error when duty not found', async () => {
      mockApiClient.get.mockRejectedValueOnce(new ApiError('Not found', 404));

      const result = await dutyService.getDutyById(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('999');
    });
  });

  // ============================================
  // createDuty
  // ============================================
  describe('createDuty', () => {
    it('should create duty on success', async () => {
      const mockDuty = { id: 1, title: 'New Duty', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.post.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.createDuty({ title: 'New Duty' });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('New Duty');
    });

    it('should reject empty title', async () => {
      const result = await dutyService.createDuty({ title: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject title exceeding max length', async () => {
      const longTitle = 'a'.repeat(256);
      const result = await dutyService.createDuty({ title: longTitle });

      expect(result.success).toBe(false);
      expect(result.error).toContain('255');
    });

    it('should reject invalid status', async () => {
      const result = await dutyService.createDuty({ title: 'Test', status: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Status');
    });

    it('should reject invalid priority', async () => {
      const result = await dutyService.createDuty({ title: 'Test', priority: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Priority');
    });

    it('should reject invalid date format', async () => {
      const result = await dutyService.createDuty({ title: 'Test', start_date: '2024/01/01' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('YYYY-MM-DD');
    });
  });

  // ============================================
  // updateDuty (PUT)
  // ============================================
  describe('updateDuty', () => {
    it('should update duty on success', async () => {
      const mockDuty = { id: 1, title: 'Updated Duty', status: 'in_progress' as const, priority: 'high' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-02' };
      
      mockApiClient.put.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.updateDuty(1, { title: 'Updated Duty', status: 'in_progress' });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Duty');
      expect(mockApiClient.put).toHaveBeenCalledWith('/duties/1', { title: 'Updated Duty', status: 'in_progress' });
    });

    it('should reject empty update payload', async () => {
      const result = await dutyService.updateDuty(1, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one field');
    });

    it('should reject empty title in update', async () => {
      const result = await dutyService.updateDuty(1, { title: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty');
    });

    it('should handle 404 not found', async () => {
      mockApiClient.put.mockRejectedValueOnce(new ApiError('Not found', 404));

      const result = await dutyService.updateDuty(999, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('999');
    });

    it('should allow null for nullable fields', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.put.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.updateDuty(1, { 
        description: null, 
        start_date: null, 
        end_date: null, 
        notes: null 
      });

      expect(result.success).toBe(true);
    });

    it('should accept completed boolean field', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'completed' as const, priority: 'medium' as const, completed: true, description: null, start_date: null, end_date: null, notes: null, completed_at: '2024-01-02', deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-02' };
      
      mockApiClient.put.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.updateDuty(1, { completed: true, status: 'completed' });

      expect(result.success).toBe(true);
      expect(result.data?.completed).toBe(true);
    });
  });

  // ============================================
  // deleteDuty (DELETE)
  // ============================================
  describe('deleteDuty', () => {
    it('should delete duty on success', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ success: true, message: 'Deleted' });

      const result = await dutyService.deleteDuty(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(mockApiClient.delete).toHaveBeenCalledWith('/duties/1');
    });

    it('should handle 404 not found', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new ApiError('Not found', 404));

      const result = await dutyService.deleteDuty(999);

      expect(result.success).toBe(false);
      expect(result.error).toContain('999');
      expect(result.error).toContain('not found');
    });

    it('should handle API errors', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new ApiError('Server error', 500));

      const result = await dutyService.deleteDuty(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should handle network errors', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new NetworkError('No internet'));

      const result = await dutyService.deleteDuty(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No internet');
    });
  });

  // ============================================
  // Validation edge cases
  // ============================================
  describe('Validation edge cases', () => {
    it('should trim whitespace from title', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.post.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.createDuty({ title: '   Test   ' });

      expect(result.success).toBe(true);
    });

    it('should reject whitespace-only title', async () => {
      const result = await dutyService.createDuty({ title: '   ' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  // ============================================
  // Error handling edge cases
  // ============================================
  describe('Error handling edge cases', () => {
    it('should handle NetworkError in getDuties', async () => {
      mockApiClient.get.mockRejectedValueOnce(new NetworkError('Connection failed'));

      const result = await dutyService.getDuties();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle generic error in getDuties', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Unknown error'));

      const result = await dutyService.getDuties();

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should handle API error with message in getDutyById', async () => {
      mockApiClient.get.mockResolvedValueOnce({ success: false, message: 'Custom error message' });

      const result = await dutyService.getDutyById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error message');
    });

    it('should handle generic error in getDutyById', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Unknown error'));

      const result = await dutyService.getDutyById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should handle API error with message in createDuty', async () => {
      mockApiClient.post.mockResolvedValueOnce({ success: false, message: 'Create failed' });

      const result = await dutyService.createDuty({ title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Create failed');
    });

    it('should handle NetworkError in createDuty', async () => {
      mockApiClient.post.mockRejectedValueOnce(new NetworkError('No connection'));

      const result = await dutyService.createDuty({ title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No connection');
    });

    it('should handle API error with message in updateDuty', async () => {
      mockApiClient.put.mockResolvedValueOnce({ success: false, message: 'Update failed' });

      const result = await dutyService.updateDuty(1, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('should handle NetworkError in updateDuty', async () => {
      mockApiClient.put.mockRejectedValueOnce(new NetworkError('Connection lost'));

      const result = await dutyService.updateDuty(1, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection lost');
    });

    it('should handle generic error in updateDuty', async () => {
      mockApiClient.put.mockRejectedValueOnce(new Error('Unknown'));

      const result = await dutyService.updateDuty(1, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should handle API error with message in deleteDuty', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ success: false, message: 'Delete failed' });

      const result = await dutyService.deleteDuty(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });

    it('should handle generic error in deleteDuty', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new Error('Unknown'));

      const result = await dutyService.deleteDuty(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should validate date format correctly', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.post.mockResolvedValueOnce({ success: true, data: mockDuty });
      mockApiClient.post.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result1 = await dutyService.createDuty({ title: 'Test', start_date: '2024-01-01' });
      const result2 = await dutyService.createDuty({ title: 'Test', end_date: '2024-12-31' });

      // Valid format should not trigger date validation error
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  // ============================================
  // Validation function coverage
  // ============================================
  describe('Validation functions', () => {
    it('should validate all update fields together', async () => {
      const mockDuty = { id: 1, title: 'Test', status: 'pending' as const, priority: 'medium' as const, completed: false, description: null, start_date: null, end_date: null, notes: null, completed_at: null, deleted_at: null, created_at: '2024-01-01', updated_at: '2024-01-01' };
      
      mockApiClient.put.mockResolvedValueOnce({ success: true, data: mockDuty });

      const result = await dutyService.updateDuty(1, {
        title: 'Updated',
        description: 'New desc',
        status: 'in_progress',
        priority: 'high',
        start_date: '2024-06-01',
        end_date: '2024-06-30',
        notes: 'Note',
        completed: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid completed field type', async () => {
      const result = await dutyService.updateDuty(1, { completed: 'yes' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('boolean');
    });

    it('should reject invalid status in update', async () => {
      const result = await dutyService.updateDuty(1, { status: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Status');
    });

    it('should reject invalid priority in update', async () => {
      const result = await dutyService.updateDuty(1, { priority: 'invalid' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Priority');
    });

    it('should reject invalid start_date format in update', async () => {
      const result = await dutyService.updateDuty(1, { start_date: '01/06/2024' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('YYYY-MM-DD');
    });

    it('should reject invalid end_date format in update', async () => {
      const result = await dutyService.updateDuty(1, { end_date: '2024/06/30' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('YYYY-MM-DD');
    });
  });

  // ============================================
  // Additional coverage for remaining branches
  // ============================================
  describe('Remaining coverage', () => {
    it('should handle getDutyById with non-404 ApiError', async () => {
      mockApiClient.get.mockRejectedValueOnce(new ApiError('Forbidden', 403));

      const result = await dutyService.getDutyById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden');
    });

    it('should handle getDutyById with success=false but no message', async () => {
      mockApiClient.get.mockResolvedValueOnce({ success: false });

      const result = await dutyService.getDutyById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Duty not found');
    });

    it('should handle createDuty with success=false response', async () => {
      mockApiClient.post.mockResolvedValueOnce({ success: false });

      const result = await dutyService.createDuty({ title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create duty');
    });

    it('should handle createDuty with generic error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Unknown'));

      const result = await dutyService.createDuty({ title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should handle updateDuty with success=false response', async () => {
      mockApiClient.put.mockResolvedValueOnce({ success: false });

      const result = await dutyService.updateDuty(1, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update duty');
    });

    it('should handle updateDuty with non-404 ApiError', async () => {
      mockApiClient.put.mockRejectedValueOnce(new ApiError('Conflict', 409));

      const result = await dutyService.updateDuty(1, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Conflict');
    });
  });
});
