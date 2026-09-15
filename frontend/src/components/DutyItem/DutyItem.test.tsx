/**
 * DutyItem Component Tests
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { DutyItem } from './DutyItem';
import type { Duty } from '../../types/duty';
import { ConfigProvider } from 'antd';

// ============================================
// Test Fixtures
// ============================================

const mockDuty: Duty = {
  id: 1,
  title: 'Test Duty',
  description: 'Test description',
  status: 'pending',
  priority: 'medium',
  start_date: '2024-01-15',
  end_date: '2024-01-20',
  notes: 'Test notes',
  completed: false,
  completed_at: null,
  deleted_at: null,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

const mockCompletedDuty: Duty = {
  ...mockDuty,
  id: 2,
  title: 'Completed Duty',
  completed: true,
  completed_at: '2024-01-12T10:00:00Z',
  status: 'completed',
};

const mockOnEdit = jest.fn<void, [Duty]>();
const mockOnDelete = jest.fn<Promise<void>, [number]>();

// ============================================
// Helper
// ============================================

const renderWithAntdProvider = (ui: React.ReactElement) => {
  return render(<ConfigProvider>{ui}</ConfigProvider>);
};

// ============================================
// Setup & Teardown
// ============================================

describe('DutyItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Rendering Tests
  // ============================================

  describe('Rendering', () => {
    it('should render duty title', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Duty')).toBeInTheDocument();
    });

    it('should render duty description', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render priority tag', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should render notes if present', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    it('should not render notes section if notes are empty', () => {
      const dutyWithoutNotes = { ...mockDuty, notes: null };
      
      renderWithAntdProvider(
        <DutyItem
          duty={dutyWithoutNotes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Test notes')).not.toBeInTheDocument();
    });

    it('should render dates', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 20, 2024/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Completed State Tests
  // ============================================

  describe('Completed State', () => {
    it('should show completed styling for completed duty', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockCompletedDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const container = screen.getByText('Completed Duty').closest('.duty-item');
      expect(container).toHaveClass('duty-item--completed');
    });

    it('should show completed_at date', () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockCompletedDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/Completed: Jan 12, 2024/)).toBeInTheDocument();
    });
  });

  // ============================================
  // Edit Button Tests
  // ============================================

  describe('Edit Button', () => {
    it('should call onEdit when edit button is clicked', async () => {
      renderWithAntdProvider(
        <DutyItem
          duty={mockDuty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit duty/i });
      
      await act(async () => {
        fireEvent.click(editButton);
      });

      expect(mockOnEdit).toHaveBeenCalledWith(mockDuty);
    });
  });

  // ============================================
  // Priority Tag Tests
  // ============================================

  describe('Priority Tags', () => {
    it.each([
      ['low', 'Low'],
      ['medium', 'Medium'],
      ['high', 'High'],
      ['urgent', 'Urgent'],
    ])('should render %s priority tag', (priority, label) => {
      const duty = { ...mockDuty, priority: priority as Duty['priority'] };
      
      renderWithAntdProvider(
        <DutyItem
          duty={duty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  // ============================================
  // Status Tag Tests
  // ============================================

  describe('Status Tags', () => {
    it.each([
      ['pending', 'Pending'],
      ['in_progress', 'In Progress'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
    ])('should render %s status tag', (status, label) => {
      const duty = { ...mockDuty, status: status as Duty['status'] };
      
      renderWithAntdProvider(
        <DutyItem
          duty={duty}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
