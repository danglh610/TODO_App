/**
 * DutyList Component Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DutyList } from './DutyList';
import { dutyService } from '../../services/dutyService';
import type { Duty } from '../../types/duty';
import type { PaginatedResult } from '../../types/duty';

// ============================================
// Mock dutyService
// ============================================

jest.mock('../../services/dutyService', () => ({
  dutyService: {
    getDuties: jest.fn(),
    createDuty: jest.fn(),
    updateDuty: jest.fn(),
    deleteDuty: jest.fn(),
  },
}));

// ============================================
// Test Fixtures
// ============================================

const mockDuties: Duty[] = [
  {
    id: 1,
    title: 'First Duty',
    description: 'Description 1',
    status: 'pending',
    priority: 'high',
    start_date: '2024-01-15',
    end_date: '2024-01-20',
    notes: 'Notes 1',
    completed: false,
    completed_at: null,
    deleted_at: null,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 2,
    title: 'Second Duty',
    description: 'Description 2',
    status: 'in_progress',
    priority: 'medium',
    start_date: null,
    end_date: null,
    notes: null,
    completed: false,
    completed_at: null,
    deleted_at: null,
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
  },
];

const mockPaginatedResult: PaginatedResult<Duty> = {
  success: true,
  data: mockDuties,
  total: 2,
  page: 1,
  totalPages: 1,
};

// ============================================
// Setup & Teardown
// ============================================

describe('DutyList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dutyService.getDuties as jest.Mock).mockResolvedValue(mockPaginatedResult);
  });

  // ============================================
  // Initial Render Tests
  // ============================================

  describe('Initial Render', () => {
    it('should render header with title', async () => {
      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('My Duties')).toBeInTheDocument();
      });
    });

    it('should render subtitle with duty count', async () => {
      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('2 duties total')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new duty/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Error State Tests
  // ============================================

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to load duties',
      });

      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load duties')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Empty State Tests
  // ============================================

  describe('Empty State', () => {
    it('should show empty state when no duties', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('No duties yet')).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first duty/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Duties List Tests
  // ============================================

  describe('Duties List', () => {
    it('should render list of duties', async () => {
      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('First Duty')).toBeInTheDocument();
        expect(screen.getByText('Second Duty')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Create Form Tests
  // ============================================

  describe('Create Form', () => {
    it('should show form when add button is clicked', async () => {
      render(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new duty/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /new duty/i });
      
      await act(async () => {
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Duty')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Initial Props Tests
  // ============================================

  describe('Initial Props', () => {
    it('should use initialStatus if provided', async () => {
      render(<DutyList initialStatus="pending" />);
      
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      });
    });

    it('should use initialPriority if provided', async () => {
      render(<DutyList initialPriority="high" />);
      
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'high' })
        );
      });
    });
  });
});
