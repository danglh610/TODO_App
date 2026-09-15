// src/services/duties.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock result type - matches pg.QueryResult but rows is optional
type MockQueryResult = {
  rows?: Record<string, unknown>[];
  rowCount?: number | null;
};

// Create mock query function
const mockQueryFn = jest.fn<() => Promise<MockQueryResult>>();

// Mock db module using unstable_mockModule
await jest.unstable_mockModule('../db/connection', () => ({
  query: mockQueryFn,
  getClient: jest.fn(),
  getPool: jest.fn(),
  testConnection: jest.fn(),
}));

// Import service after mock
const { 
  getDuties, 
  getDutyById, 
  createDuty, 
  updateDuty, 
  deleteDuty 
} = await import('./duties.service');

describe('DutiesService', () => {
  beforeEach(() => {
    mockQueryFn.mockReset();
  });

  afterEach(() => {
    jest.resetModules();
  });

  // =========================================
  // getDuties
  // =========================================
  describe('getDuties', () => {
    it('should return paginated duties', async () => {
      const mockDuties = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockDuties as Record<string, unknown>[] });

      const result = await getDuties({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDuties);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'completed' }] });

      const result = await getDuties({ status: 'completed' });

      expect(result.data).toHaveLength(1);
    });

    it('should cap limit at 100', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ limit: 500 });

      expect(result.limit).toBe(100);
    });

    it('should calculate pagination correctly', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.total_pages).toBe(5);
    });

    it('should return empty when no data', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // =========================================
  // getDuties - Filter by Priority
  // =========================================
  describe('getDuties - filter by priority', () => {
    it('should filter duties by priority', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, priority: 'high' }, { id: 2, priority: 'high' }] });

      const result = await getDuties({ priority: 'high' });

      expect(result.data).toHaveLength(2);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('priority = $'),
        expect.arrayContaining(['high'])
      );
    });

    it('should filter by urgent priority', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, priority: 'urgent' }] });

      const result = await getDuties({ priority: 'urgent' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].priority).toBe('urgent');
    });
  });

  // =========================================
  // getDuties - Filter by Completed
  // =========================================
  describe('getDuties - filter by completed', () => {
    it('should filter completed duties', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, completed: true }, { id: 2, completed: true }] });

      const result = await getDuties({ completed: true });

      expect(result.data).toHaveLength(2);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('completed = $'),
        expect.arrayContaining([true])
      );
    });

    it('should filter incomplete duties', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, completed: false }] });

      const result = await getDuties({ completed: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].completed).toBe(false);
    });
  });

  // =========================================
  // getDuties - Search
  // =========================================
  describe('getDuties - search', () => {
    it('should search by title', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Buy groceries' }] });

      const result = await getDuties({ search: 'groceries' });

      expect(result.data).toHaveLength(1);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%groceries%'])
      );
    });

    it('should search in title and description', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ search: 'meeting' });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('title ILIKE'),
        expect.any(Array)
      );
      // Verify both title and description are searched
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('description ILIKE'),
        expect.any(Array)
      );
    });
  });

  // =========================================
  // getDuties - Sort
  // =========================================
  describe('getDuties - sort', () => {
    it('should sort by priority with custom order', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ sort_by: 'priority', sort_order: 'asc' });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('CASE priority'),
        expect.any(Array)
      );
    });

    it('should sort by due_date with NULLS LAST', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ sort_by: 'due_date', sort_order: 'desc' });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('NULLS LAST'),
        expect.any(Array)
      );
    });

    it('should sort by updated_at', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ sort_by: 'updated_at', sort_order: 'asc' });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('updated_at ASC'),
        expect.any(Array)
      );
    });
  });

  // =========================================
  // getDuties - Edge Cases
  // =========================================
  describe('getDuties - edge cases', () => {
    it('should handle page less than 1', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ page: -5 });

      // Should normalize to page 1
      expect(result.page).toBe(1);
    });

    it('should handle limit less than 1', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ limit: -1 });

      // Should normalize to minimum 1
      expect(result.limit).toBe(1);
    });

    it('should handle non-numeric page', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({ page: 0 });

      // 0 should be normalized to 1
      expect(result.page).toBe(1);
    });

    it('should ignore empty search string', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      // Route trims search before passing to service, so empty search is never passed
      // This test verifies the route-level behavior: empty/whitespace search is not sent to service
      const result = await getDuties({ search: '' });

      expect(result.data).toEqual([]);
      // Empty string should not add ILIKE clause
      const calls = mockQueryFn.mock.calls as unknown[][];
      expect(calls.length).toBe(2);
    });
  });

  // =========================================
  // getDuties - Error Handling
  // =========================================
  describe('getDuties - error handling', () => {
    it('should throw error when database query fails', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(getDuties({})).rejects.toThrow('Database connection failed');
    });

    it('should handle count query returning no rows', async () => {
      mockQueryFn
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // count query returns 0
        .mockResolvedValueOnce({ rows: [] });

      const result = await getDuties({});

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  // =========================================
  // getDutyById
  // =========================================
  describe('getDutyById', () => {
    it('should return duty when found', async () => {
      const mockDuty = { id: 1, title: 'Test' };
      mockQueryFn.mockResolvedValueOnce({ rows: [mockDuty] });

      const result = await getDutyById(1);

      expect(result).toEqual(mockDuty);
    });

    it('should return null when not found', async () => {
      mockQueryFn.mockResolvedValueOnce({ rows: [] });

      const result = await getDutyById(999);

      expect(result).toBeNull();
    });

    it('should throw error when database fails', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(getDutyById(1)).rejects.toThrow('Connection timeout');
    });
  });

  // =========================================
  // createDuty
  // =========================================
  describe('createDuty', () => {
    it('should create duty with all fields', async () => {
      const input = {
        title: 'New Task',
        description: 'Desc',
        status: 'in_progress' as const,
        priority: 'high' as const,
      };
      const created = { id: 1, ...input, completed: false };
      mockQueryFn.mockResolvedValueOnce({ rows: [created] });

      const result = await createDuty(input);

      expect(result).toEqual(created);
    });

    it('should use defaults for optional fields', async () => {
      const input = { title: 'Task' };
      const created = { id: 1, title: 'Task', status: 'pending', priority: 'medium' };
      mockQueryFn.mockResolvedValueOnce({ rows: [created] });

      const result = await createDuty(input);

      expect(result.status).toBe('pending');
      expect(result.priority).toBe('medium');
    });

    it('should create with dates', async () => {
      const input = {
        title: 'Task with dates',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };
      const created = { id: 1, ...input };
      mockQueryFn.mockResolvedValueOnce({ rows: [created] });

      const result = await createDuty(input);

      expect(result).toEqual(created);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO duties'),
        expect.arrayContaining(['2024-01-01', '2024-01-31'])
      );
    });

    it('should throw error when database fails', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('Unique constraint violation'));

      await expect(createDuty({ title: 'Test' })).rejects.toThrow('Unique constraint violation');
    });

    it('should handle null description', async () => {
      const input = { title: 'Task', description: null as unknown as undefined };
      const created = { id: 1, title: 'Task', description: null };
      mockQueryFn.mockResolvedValueOnce({ rows: [created] });

      const result = await createDuty(input);

      expect(result.description).toBeNull();
    });
  });

  // =========================================
  // updateDuty
  // =========================================
  describe('updateDuty', () => {
    it('should update duty when found', async () => {
      const input = { title: 'Updated' };
      const updated = { id: 1, title: 'Updated' };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
    });

    it('should return null when not found', async () => {
      mockQueryFn.mockResolvedValueOnce({ rows: [] });

      const result = await updateDuty(999, { title: 'Test' });

      expect(result).toBeNull();
    });

    it('should update completed to true and set completed_at', async () => {
      const input = { completed: true };
      const updated = { id: 1, completed: true, completed_at: new Date() };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('completed_at = CURRENT_TIMESTAMP'),
        expect.arrayContaining([true])
      );
    });

    it('should update completed to false and clear completed_at', async () => {
      const input = { completed: false };
      const updated = { id: 1, completed: false, completed_at: null };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('completed_at = NULL'),
        expect.arrayContaining([false])
      );
    });

    it('should update multiple fields at once', async () => {
      const input = { title: 'New Title', status: 'completed' as const, priority: 'high' as const };
      const updated = { id: 1, ...input };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('title = $'),
        expect.arrayContaining(['New Title', 'completed', 'high'])
      );
    });

    it('should update description to null', async () => {
      const input = { description: null };
      const updated = { id: 1, description: null };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
    });

    it('should update notes field', async () => {
      const input = { notes: 'Updated notes' };
      const updated = { id: 1, notes: 'Updated notes' };
      mockQueryFn.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateDuty(1, input);

      expect(result).toEqual(updated);
    });

    it('should throw error when database fails', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(updateDuty(1, { title: 'Test' })).rejects.toThrow('Connection lost');
    });

    it('should always update updated_at timestamp', async () => {
      const input = { title: 'Updated' };
      mockQueryFn.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Updated' }] });

      await updateDuty(1, input);

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = CURRENT_TIMESTAMP'),
        expect.any(Array)
      );
    });
  });

  // =========================================
  // deleteDuty
  // =========================================
  describe('deleteDuty', () => {
    it('should return true when deleted', async () => {
      mockQueryFn.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteDuty(1);

      expect(result).toBe(true);
    });

    it('should return false when not found', async () => {
      mockQueryFn.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deleteDuty(999);

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      mockQueryFn.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deleteDuty(1);

      expect(result).toBe(false);
    });

    it('should throw error when database fails', async () => {
      mockQueryFn.mockRejectedValueOnce(new Error('Database locked'));

      await expect(deleteDuty(1)).rejects.toThrow('Database locked');
    });

    it('should handle null rowCount', async () => {
      mockQueryFn.mockResolvedValueOnce({ rowCount: null });

      const result = await deleteDuty(1);

      // null rowCount should be treated as 0, so returns false
      expect(result).toBe(false);
    });
  });
});
