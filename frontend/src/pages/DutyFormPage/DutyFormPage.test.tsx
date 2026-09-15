/**
 * DutyFormPage Component Tests
 * 
 * Note: These tests use simplified mocks for Ant Design components.
 * For full integration testing, use e2e tests with Playwright/Cypress.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import type { Duty } from '../../types/duty';

// ============================================
// Mock dutyService
// ============================================

const mockNavigate = jest.fn();
const mockGetDutyById = jest.fn();
const mockCreateDuty = jest.fn();
const mockUpdateDuty = jest.fn();

jest.mock('../../services/dutyService', () => ({
  dutyService: {
    getDutyById: (...args: any[]) => mockGetDutyById(...args),
    createDuty: (...args: any[]) => mockCreateDuty(...args),
    updateDuty: (...args: any[]) => mockUpdateDuty(...args),
  },
}));

// ============================================
// Mock react-router-dom
// ============================================

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

// ============================================
// Test Fixtures
// ============================================

const mockDuty: Duty = {
  id: 1,
  title: 'Existing Duty',
  description: 'Test description',
  status: 'pending',
  priority: 'high',
  start_date: '2024-01-15',
  end_date: '2024-01-20',
  notes: 'Test notes',
  completed: false,
  completed_at: null,
  deleted_at: null,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

// ============================================
// Import component AFTER mocks are set up
// ============================================

import { DutyFormPage } from './DutyFormPage';

// ============================================
// Setup & Teardown
// ============================================

describe('DutyFormPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: new duty mode (no id param)
    (require('react-router-dom') as any).useParams.mockReturnValue({});
  });

  // ============================================
  // Basic Rendering Tests
  // ============================================

  describe('Basic Rendering', () => {
    it('should render form container', async () => {
      render(<DutyFormPage />);
      
      // Wait for form to load
      await waitFor(() => {
        const formContainer = document.querySelector('.duty-form-page');
        expect(formContainer).toBeInTheDocument();
      });
    });

    it('should render header section', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        const header = document.querySelector('.duty-form-page__header');
        expect(header).toBeInTheDocument();
      });
    });

    it('should render form card', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        const card = document.querySelector('.duty-form-page__card');
        expect(card).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // New Duty Mode Tests
  // ============================================

  describe('New Duty Mode', () => {
    it('should show "New Duty" title', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('New Duty')).toBeInTheDocument();
      });
    });

    it('should show Create button', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      });
    });

    it('should show Cancel button', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Edit Duty Mode Tests
  // ============================================

  describe('Edit Duty Mode', () => {
    it('should show "Edit Duty" title when editing', async () => {
      (require('react-router-dom') as any).useParams.mockReturnValue({ id: '1' });
      mockGetDutyById.mockResolvedValue({
        success: true,
        data: mockDuty,
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Duty')).toBeInTheDocument();
      });
    });

    it('should show Update button when editing', async () => {
      (require('react-router-dom') as any).useParams.mockReturnValue({ id: '1' });
      mockGetDutyById.mockResolvedValue({
        success: true,
        data: mockDuty,
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      });
    });

    it('should show error when duty not found', async () => {
      (require('react-router-dom') as any).useParams.mockReturnValue({ id: '999' });
      mockGetDutyById.mockResolvedValue({
        success: false,
        error: 'Duty not found',
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Duty not found')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Form Field Tests
  // ============================================

  describe('Form Fields', () => {
    it('should render all required fields', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        // Check all field labels are present
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('End Date')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
      });
    });

    it('should show required field markers', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        const requiredMarkers = document.querySelectorAll('.duty-form-page__required');
        expect(requiredMarkers.length).toBeGreaterThan(0);
      });
    });

    it('should render title input', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter duty title');
        expect(input).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Validation Tests (Simplified for Mocked Components)
  // ============================================

  describe('Form Validation', () => {
    it('should disable button when form is invalid', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter duty title')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeDisabled();
    });

    it('should show required field markers', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        const requiredMarkers = document.querySelectorAll('.duty-form-page__required');
        expect(requiredMarkers.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // Create Duty Tests
  // ============================================

  describe('Create Duty', () => {
    it('should call createDuty service with valid data', async () => {
      mockCreateDuty.mockResolvedValue({
        success: true,
        data: { ...mockDuty, id: 2, title: 'New Duty' },
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter duty title')).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByPlaceholderText('Enter duty title');
      fireEvent.change(titleInput, { target: { value: 'New Duty' } });

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateDuty).toHaveBeenCalled();
      });
    });

    it('should show error when create fails', async () => {
      mockCreateDuty.mockResolvedValue({
        success: false,
        error: 'Failed to create duty',
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter duty title')).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByPlaceholderText('Enter duty title');
      fireEvent.change(titleInput, { target: { value: 'New Duty' } });

      // Submit
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create duty')).toBeInTheDocument();
      });
    });

    it('should navigate on successful create', async () => {
      mockCreateDuty.mockResolvedValue({
        success: true,
        data: { ...mockDuty, id: 2 },
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter duty title')).toBeInTheDocument();
      });

      // Fill form and submit
      const titleInput = screen.getByPlaceholderText('Enter duty title');
      fireEvent.change(titleInput, { target: { value: 'New Duty' } });

      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  // ============================================
  // Update Duty Tests
  // ============================================

  describe('Update Duty', () => {
    it('should call updateDuty service when updating', async () => {
      (require('react-router-dom') as any).useParams.mockReturnValue({ id: '1' });
      mockGetDutyById.mockResolvedValue({
        success: true,
        data: mockDuty,
      });
      mockUpdateDuty.mockResolvedValue({
        success: true,
        data: { ...mockDuty, title: 'Updated Duty' },
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Duty')).toBeInTheDocument();
      });

      // Update title
      const titleInput = screen.getByPlaceholderText('Enter duty title');
      fireEvent.change(titleInput, { target: { value: 'Updated Duty' } });

      // Submit
      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateDuty).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ title: 'Updated Duty' })
        );
      });
    });

    it('should navigate on successful update', async () => {
      (require('react-router-dom') as any).useParams.mockReturnValue({ id: '1' });
      mockGetDutyById.mockResolvedValue({
        success: true,
        data: mockDuty,
      });
      mockUpdateDuty.mockResolvedValue({
        success: true,
        data: { ...mockDuty, title: 'Updated Duty' },
      });

      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Duty')).toBeInTheDocument();
      });

      // Update and submit
      const titleInput = screen.getByPlaceholderText('Enter duty title');
      fireEvent.change(titleInput, { target: { value: 'Updated Duty' } });

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  // ============================================
  // Cancel Navigation Tests
  // ============================================

  describe('Cancel Navigation', () => {
    it('should navigate to home when Cancel is clicked', async () => {
      render(<DutyFormPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
