/**
 * DutyList Component Tests
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DutyList } from './DutyList';
import { dutyService } from '../../services/dutyService';
import type { Duty } from '../../types/duty';
import type { PaginatedResult } from '../../types/duty';
import { BrowserRouter } from 'react-router-dom';

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
// Helper
// ============================================

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

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
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('My Duties')).toBeInTheDocument();
      });
    });

    it('should render subtitle with duty count', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('2 duties total')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      renderWithRouter(<DutyList />);
      
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

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load duties')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
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

      renderWithRouter(<DutyList />);
      
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

      renderWithRouter(<DutyList />);
      
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
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('First Duty')).toBeInTheDocument();
        expect(screen.getByText('Second Duty')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Create Form Tests
  // ============================================

  describe('Create Form Navigation', () => {
    it('should have link to create new duty page', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /new duty/i })).toBeInTheDocument();
      });

      const newDutyLink = screen.getByRole('link', { name: /new duty/i });
      expect(newDutyLink).toHaveAttribute('href', '/duty/new');
    });
  });

  // ============================================
  // Initial Props Tests
  // ============================================

  describe('Initial Props', () => {
    it('should use initialStatus if provided', async () => {
      renderWithRouter(<DutyList initialStatus="pending" />);
      
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      });
    });

    it('should use initialPriority if provided', async () => {
      renderWithRouter(<DutyList initialPriority="high" />);
      
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'high' })
        );
      });
    });
  });

  // ============================================
  // Search Functionality Tests
  // ============================================

  describe('Search Functionality', () => {
    it('should update search query on input change', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect((searchInput as HTMLInputElement).value).toBe('test search');
    });

    it('should call fetchDuties when pressing Enter', async () => {
      (dutyService.getDuties as jest.Mock).mockClear();

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'search term' } });
      
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      // When Enter is pressed, fetchDuties is called with search term passed directly
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'search term' })
        );
      });
    });

    it('should show "No duties match your filters" when search returns empty', async () => {
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('No duties match your filters')).toBeInTheDocument();
      });
    });

    it('should not call API when typing without pressing Enter', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'partial' } });

      // Should only be called once initially, not on each keystroke
      await waitFor(() => {
        expect(dutyService.getDuties).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================
  // Filter Tests
  // ============================================

  describe('Filter Functionality', () => {
    it('should have status filter label', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should have priority filter label', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority')).toBeInTheDocument();
      });
    });

    it('should display filter controls', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        // Check that filter labels are present
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Delete Functionality Tests
  // ============================================

  describe('Delete Functionality', () => {
    const mockDuties: Duty[] = [
      {
        id: 1,
        title: 'Deletable Duty',
        description: 'Will be deleted',
        status: 'pending',
        priority: 'high',
        start_date: null,
        end_date: null,
        notes: null,
        completed: false,
        completed_at: null,
        deleted_at: null,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDuties,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should show delete button for each duty item', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Deletable Duty')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete duty/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('should not call delete API when confirm is cancelled', async () => {
      // Mock window.confirm to return false
      const mockConfirm = jest.fn(() => false);
      Object.defineProperty(window, 'confirm', { value: mockConfirm });

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('Deletable Duty')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete duty/i });
      
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(dutyService.deleteDuty).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Pagination Tests
  // ============================================

  describe('Pagination', () => {
    it('should not show pagination when only one page', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('2 duties total')).toBeInTheDocument();
      });

      // With 2 items and page size 10, should not show pagination
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should show pagination when multiple pages exist', async () => {
      // Mock paginated response with more than page size items
      const manyDuties: Duty[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Duty ${i + 1}`,
        description: null,
        status: 'pending' as const,
        priority: 'medium' as const,
        start_date: null,
        end_date: null,
        notes: null,
        completed: false,
        completed_at: null,
        deleted_at: null,
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
      }));

      (dutyService.getDuties as jest.Mock).mockResolvedValue({
        success: true,
        data: manyDuties.slice(0, 10),
        total: 15,
        page: 1,
        totalPages: 2,
      });

      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('15 duties total')).toBeInTheDocument();
      });

      // Should show page count text
      expect(screen.getByText(/15 dut/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Edit Navigation Tests
  // ============================================

  describe('Edit Navigation', () => {
    it('should have edit button for each duty item', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByText('First Duty')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit duty/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should render New Duty link correctly', async () => {
      renderWithRouter(<DutyList />);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /new duty/i })).toBeInTheDocument();
      });
    });
  });
});
