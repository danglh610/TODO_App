/**
 * DutyFormPage Component
 * Flat form for creating/editing duties
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Typography, Spin, Card, DatePicker } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { dutyService, type CreateDutyInput, type UpdateDutyInput } from '../../services/dutyService';
import type { Duty } from '../../types/duty';
import './DutyFormPage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function DutyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDuty, setFetchingDuty] = useState(isEditing);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Validate date range
  const validateDateRange = useCallback((start: Dayjs | null, end: Dayjs | null) => {
    if (start && end && end.isBefore(start)) {
      setDateError('End date must be after start date');
    } else {
      setDateError(null);
    }
  }, []);

  // Fetch duty data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchDuty = async () => {
        setFetchingDuty(true);
        try {
          const result = await dutyService.getDutyById(parseInt(id, 10));
          if (result.success && result.data) {
            const duty: Duty = result.data;
            setTitle(duty.title);
            setDescription(duty.description || '');
            setStatus(duty.status);
            setPriority(duty.priority);
            setStartDate(duty.start_date ? dayjs(duty.start_date) : null);
            setEndDate(duty.end_date ? dayjs(duty.end_date) : null);
            setNotes(duty.notes || '');
            validateDateRange(duty.start_date ? dayjs(duty.start_date) : null, duty.end_date ? dayjs(duty.end_date) : null);
          } else {
            setApiError('Duty not found');
          }
        } catch {
          setApiError('Failed to fetch duty');
        } finally {
          setFetchingDuty(false);
        }
      };
      fetchDuty();
    } else {
      // Set defaults for new duty
      setStatus('pending');
      setPriority('medium');
    }
  }, [isEditing, id, validateDateRange]);

  // Handle save
  const handleSave = useCallback(async () => {
    setTitleError(null);
    setStatusError(null);
    setPriorityError(null);
    setDateError(null);
    setApiError(null);

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    // Validate status
    if (!status) {
      setStatusError('Status is required');
      return;
    }

    // Validate priority
    if (!priority) {
      setPriorityError('Priority is required');
      return;
    }

    // Validate date range
    if (startDate && endDate && endDate.isBefore(startDate)) {
      setDateError('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isEditing && id) {
        const data: UpdateDutyInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          status: status as any,
          priority: priority as any,
          start_date: startDate ? startDate.format('YYYY-MM-DD') : undefined,
          end_date: endDate ? endDate.format('YYYY-MM-DD') : undefined,
          notes: notes.trim() || undefined,
        };
        result = await dutyService.updateDuty(parseInt(id, 10), data);
      } else {
        const data: CreateDutyInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          status: status as any,
          priority: priority as any,
          start_date: startDate ? startDate.format('YYYY-MM-DD') : undefined,
          end_date: endDate ? endDate.format('YYYY-MM-DD') : undefined,
          notes: notes.trim() || undefined,
        };
        result = await dutyService.createDuty(data);
      }

      if (result.success) {
        navigate('/');
      } else {
        setApiError(result.error || 'Failed to save duty');
      }
    } catch {
      setApiError('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [title, description, status, priority, startDate, endDate, notes, isEditing, id, navigate]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Check if form is valid for submit button
  const isFormValid = useMemo(() => {
    return (
      title.trim() !== '' &&
      status !== '' &&
      priority !== '' &&
      !titleError &&
      !statusError &&
      !priorityError &&
      !dateError &&
      !loading
    );
  }, [title, status, priority, titleError, statusError, priorityError, dateError, loading]);

  if (fetchingDuty) {
    return (
      <div className="duty-form-page">
        <div className="duty-form-page__loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="duty-form-page">
      {/* Header */}
      <div className="duty-form-page__header">
        <div className="duty-form-page__header-left">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="duty-form-page__back-btn" />
          <Title level={2} className="duty-form-page__title">{isEditing ? 'Edit Duty' : 'New Duty'}</Title>
        </div>
      </div>

      {/* Form Card */}
      <Card className="duty-form-page__card">
        {apiError && (
          <div className="duty-form-page__api-error">{apiError}</div>
        )}

        <div className="duty-form-page__form">
          {/* Title */}
          <div className="duty-form-page__field">
            <Text type="secondary" className="duty-form-page__label">
              Title <span className="duty-form-page__required">*</span>
            </Text>
            <Input
              placeholder="Enter duty title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              size="large"
              status={titleError ? 'error' : undefined}
            />
            {titleError && <span className="duty-form-page__field-error">{titleError}</span>}
          </div>

          {/* Description */}
          <div className="duty-form-page__field">
            <Text type="secondary" className="duty-form-page__label">Description</Text>
            <TextArea
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status & Priority - Same Row */}
          <div className="duty-form-page__row">
            <div className="duty-form-page__field">
              <Text type="secondary" className="duty-form-page__label">
                Status <span className="duty-form-page__required">*</span>
              </Text>
              <Select
                value={status || undefined}
                onChange={(value) => {
                  setStatus(value);
                  if (statusError) setStatusError(null);
                }}
                style={{ width: '100%' }}
                size="large"
                placeholder="Select status"
              >
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="in_progress">In Progress</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
              {statusError && <span className="duty-form-page__field-error">{statusError}</span>}
            </div>
            <div className="duty-form-page__field">
              <Text type="secondary" className="duty-form-page__label">
                Priority <span className="duty-form-page__required">*</span>
              </Text>
              <Select
                value={priority || undefined}
                onChange={(value) => {
                  setPriority(value);
                  if (priorityError) setPriorityError(null);
                }}
                style={{ width: '100%' }}
                size="large"
                placeholder="Select priority"
              >
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="urgent">Urgent</Select.Option>
              </Select>
              {priorityError && <span className="duty-form-page__field-error">{priorityError}</span>}
            </div>
          </div>

          {/* Start Date & End Date - Same Row */}
          <div className="duty-form-page__row">
            <div className="duty-form-page__field">
              <Text type="secondary" className="duty-form-page__label">Start Date</Text>
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  validateDateRange(date, endDate);
                }}
                placeholder="Select start date"
              />
            </div>
            <div className="duty-form-page__field">
              <Text type="secondary" className="duty-form-page__label">End Date</Text>
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  validateDateRange(startDate, date);
                }}
                placeholder="Select end date"
              />
              {dateError && <span className="duty-form-page__field-error">{dateError}</span>}
            </div>
          </div>

          {/* Notes */}
          <div className="duty-form-page__field">
            <Text type="secondary" className="duty-form-page__label">Notes</Text>
            <TextArea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="duty-form-page__actions">
            <Button onClick={handleBack} disabled={loading}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              disabled={!isFormValid}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DutyFormPage;
