// src/routes/duties.routes.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

// Mock service functions
const mockGetDuties = jest.fn<() => Promise<unknown>>();
const mockGetDutyById = jest.fn<() => Promise<unknown>>();
const mockCreateDuty = jest.fn<() => Promise<unknown>>();
const mockUpdateDuty = jest.fn<() => Promise<unknown>>();
const mockDeleteDuty = jest.fn<() => Promise<boolean>>();

// Mock duties.service BEFORE importing router
jest.unstable_mockModule('../services/duties.service', () => ({
  __esModule: true,
  getDuties: mockGetDuties,
  getDutyById: mockGetDutyById,
  createDuty: mockCreateDuty,
  updateDuty: mockUpdateDuty,
  deleteDuty: mockDeleteDuty,
  default: {
    getDuties: mockGetDuties,
    getDutyById: mockGetDutyById,
    createDuty: mockCreateDuty,
    updateDuty: mockUpdateDuty,
    deleteDuty: mockDeleteDuty,
  },
}));

// Import router after mock is set up
const { default: router } = await import('./duties.routes');

// Helper to create mock req/res
function createMocks() {
  const res = {
    status: jest.fn<() => { json: (data: unknown) => unknown }>().mockReturnThis(),
    json: jest.fn<() => unknown>(),
  } as unknown as Response;
  const req = {
    query: {} as Record<string, unknown>,
    params: {} as Record<string, string>,
    body: {} as Record<string, unknown>,
  } as unknown as Request;
  return { req, res };
}

// Call route handler by path and method
async function callRoute(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  req: Request,
  res: Response
): Promise<void> {
  const handlers = (router as unknown as { stack: { route?: { path: string; methods: Record<string, boolean>; stack: { handle: (req: Request, res: Response, next: () => void) => Promise<void> }[] } }[] }).stack
    .filter((layer) => layer.route?.path === path && layer.route?.methods[method])
    .map((layer) => layer.route?.stack?.[0]?.handle);

  if (handlers.length === 0) {
    throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  }
  await handlers[0]!(req, res, () => Promise.resolve());
}

describe('DutiesRoutes', () => {
  beforeEach(() => {
    mockGetDuties.mockReset();
    mockGetDutyById.mockReset();
    mockCreateDuty.mockReset();
    mockUpdateDuty.mockReset();
    mockDeleteDuty.mockReset();
  });

  // =========================================
  // GET /
  // =========================================
  describe('GET /', () => {
    it('should return duties list', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, title: 'Task 1' }],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };
      mockGetDuties.mockResolvedValueOnce(mockResponse);

      const { req, res } = createMocks();
      await callRoute('get', '/', req, res);

      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 400 for invalid page', async () => {
      const { req, res } = createMocks();
      req.query = { page: 'invalid' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for negative limit', async () => {
      const { req, res } = createMocks();
      req.query = { limit: '-1' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status', async () => {
      const { req, res } = createMocks();
      req.query = { status: 'invalid_status' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid priority', async () => {
      const { req, res } = createMocks();
      req.query = { priority: 'super_high' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid completed value', async () => {
      const { req, res } = createMocks();
      req.query = { completed: 'maybe' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid sort_by field', async () => {
      const { req, res } = createMocks();
      req.query = { sort_by: 'invalid_field' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid sort_order value', async () => {
      const { req, res } = createMocks();
      req.query = { sort_order: 'random' };

      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 when service throws error', async () => {
      mockGetDuties.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks();
      await callRoute('get', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });

    it('should parse and pass query params to service', async () => {
      mockGetDuties.mockResolvedValueOnce({
        success: true,
        data: [],
        total: 0,
        page: 2,
        limit: 20,
        total_pages: 0,
      });

      const { req, res } = createMocks();
      req.query = { page: '2', limit: '20', status: 'pending' };

      await callRoute('get', '/', req, res);

      expect(mockGetDuties).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: 'pending',
      });
    });
  });

  // =========================================
  // GET /:id
  // =========================================
  describe('GET /:id', () => {
    it('should return duty when found', async () => {
      const mockDuty = { id: 1, title: 'Task 1' };
      mockGetDutyById.mockResolvedValueOnce(mockDuty);

      const { req, res } = createMocks();
      req.params = { id: '1' };

      await callRoute('get', '/:id', req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDuty,
      });
    });

    it('should return 400 for invalid ID', async () => {
      const { req, res } = createMocks();
      req.params = { id: 'invalid' };

      await callRoute('get', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for negative ID', async () => {
      const { req, res } = createMocks();
      req.params = { id: '-1' };

      await callRoute('get', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when duty not found', async () => {
      mockGetDutyById.mockResolvedValueOnce(null);

      const { req, res } = createMocks();
      req.params = { id: '999' };

      await callRoute('get', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should pass parsed ID to service', async () => {
      mockGetDutyById.mockResolvedValueOnce(null);

      const { req, res } = createMocks();
      req.params = { id: '42' };

      await callRoute('get', '/:id', req, res);

      expect(mockGetDutyById).toHaveBeenCalledWith(42);
    });

    it('should return 500 when service throws error', async () => {
      mockGetDutyById.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks();
      req.params = { id: '1' };

      await callRoute('get', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });
  });

  // =========================================
  // POST /
  // =========================================
  describe('POST /', () => {
    it('should create duty with valid data', async () => {
      const createdDuty = { id: 1, title: 'New Task', status: 'pending', priority: 'medium' };
      mockCreateDuty.mockResolvedValueOnce(createdDuty);

      const { req, res } = createMocks();
      req.body = { title: 'New Task', status: 'pending', priority: 'medium' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: createdDuty,
        message: 'Duty created successfully',
      });
    });

    it('should return 400 when title missing', async () => {
      const { req, res } = createMocks();
      req.body = {};

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when title too long', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'a'.repeat(256) };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', status: 'invalid' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid priority', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', priority: 'invalid' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when status is missing', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', status: '' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Status is required')
        })
      );
    });

    it('should return 400 when priority is missing', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', status: 'pending', priority: '' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Priority is required')
        })
      );
    });

    it('should return 400 when end_date is before start_date', async () => {
      const { req, res } = createMocks();
      req.body = {
        title: 'Task',
        status: 'pending',
        priority: 'medium',
        start_date: '2024-12-31',
        end_date: '2024-01-01'
      };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('End date must be on or after start date')
        })
      );
    });

    it('should accept valid duty with all fields', async () => {
      const createdDuty = {
        id: 1,
        title: 'Complete Task',
        status: 'completed',
        priority: 'high',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };
      mockCreateDuty.mockResolvedValueOnce(createdDuty);

      const { req, res } = createMocks();
      req.body = {
        title: 'Complete Task',
        status: 'completed',
        priority: 'high',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 for invalid date format', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', start_date: '2024/01/01' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid end_date format', async () => {
      const { req, res } = createMocks();
      req.body = { title: 'Task', end_date: '01-01-2024' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 when service throws error', async () => {
      mockCreateDuty.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks();
      req.body = { title: 'New Task', status: 'pending', priority: 'medium' };

      await callRoute('post', '/', req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });

    it('should trim whitespace from title', async () => {
      const createdDuty = { id: 1, title: 'Task', status: 'pending', priority: 'medium' };
      mockCreateDuty.mockResolvedValueOnce(createdDuty);

      const { req, res } = createMocks();
      req.body = { title: '  Task  ', status: 'pending', priority: 'medium' };

      await callRoute('post', '/', req, res);

      expect(mockCreateDuty).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Task' })
      );
    });
  });

  // =========================================
  // PUT /:id
  // =========================================
  describe('PUT /:id', () => {
    it('should update duty when found', async () => {
      const updatedDuty = { id: 1, title: 'Updated' };
      mockUpdateDuty.mockResolvedValueOnce(updatedDuty);

      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { title: 'Updated' };

      await callRoute('put', '/:id', req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedDuty,
        message: 'Duty updated successfully',
      });
    });

    it('should return 400 for invalid ID', async () => {
      const { req, res } = createMocks();
      req.params = { id: 'invalid' };
      req.body = { title: 'Updated' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when no fields provided', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = {};

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when duty not found', async () => {
      mockUpdateDuty.mockResolvedValueOnce(null);

      const { req, res } = createMocks();
      req.params = { id: '999' };
      req.body = { title: 'Updated' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid completed value', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { completed: 'yes' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when status is empty string', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { status: '' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Status is required')
        })
      );
    });

    it('should return 400 when priority is empty string', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { priority: '' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Priority is required')
        })
      );
    });

    it('should return 400 when end_date is before start_date on update', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = {
        start_date: '2024-12-31',
        end_date: '2024-01-01'
      };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('End date must be on or after start date')
        })
      );
    });

    it('should return 400 for invalid date format', async () => {
      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { start_date: '2024/01/01' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 when service throws error', async () => {
      mockUpdateDuty.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks();
      req.params = { id: '1' };
      req.body = { title: 'Updated' };

      await callRoute('put', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });
  });

  // =========================================
  // DELETE /:id
  // =========================================
  describe('DELETE /:id', () => {
    it('should delete duty when found', async () => {
      mockDeleteDuty.mockResolvedValueOnce(true);

      const { req, res } = createMocks();
      req.params = { id: '1' };

      await callRoute('delete', '/:id', req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Duty with ID 1 deleted successfully',
      });
    });

    it('should return 400 for invalid ID', async () => {
      const { req, res } = createMocks();
      req.params = { id: 'invalid' };

      await callRoute('delete', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when duty not found', async () => {
      mockDeleteDuty.mockResolvedValueOnce(false);

      const { req, res } = createMocks();
      req.params = { id: '999' };

      await callRoute('delete', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should pass parsed ID to service', async () => {
      mockDeleteDuty.mockResolvedValueOnce(true);

      const { req, res } = createMocks();
      req.params = { id: '42' };

      await callRoute('delete', '/:id', req, res);

      expect(mockDeleteDuty).toHaveBeenCalledWith(42);
    });

    it('should return 500 when service throws error', async () => {
      mockDeleteDuty.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks();
      req.params = { id: '1' };

      await callRoute('delete', '/:id', req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error'
        })
      );
    });
  });
});
