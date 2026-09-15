/**
 * DutyItem Component
 * Displays a single duty item with edit and delete capabilities using Ant Design
 */

import { useState, useCallback } from 'react';
import { Tag, Space, Popconfirm, Typography, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { Duty } from '../../types/duty';
import './DutyItem.css';

// ============================================
// Types
// ============================================

const { Text } = Typography;

export interface DutyItemProps {
  /** Duty data to display */
  duty: Duty;
  /** Callback when edit button is clicked */
  onEdit: (duty: Duty) => void;
  /** Callback when delete button is clicked */
  onDelete: (id: number) => Promise<void>;
  /** Whether the item is being processed */
  isLoading?: boolean;
}

// ============================================
// Constants
// ============================================

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'gold',
  high: 'orange',
  urgent: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// ============================================
// Component
// ============================================

export function DutyItem({
  duty,
  onEdit,
  onDelete,
  isLoading = false,
}: DutyItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(duty.id);
    } finally {
      setIsDeleting(false);
    }
  }, [duty.id, onDelete]);

  // Handle edit click
  const handleEdit = useCallback(() => {
    onEdit(duty);
  }, [duty, onEdit]);

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`duty-item ${duty.completed ? 'duty-item--completed' : ''}`}>
      {/* Content */}
      <div className="duty-item__content">
        <div className="duty-item__header">
          <Text 
            delete={duty.completed} 
            className="duty-item__title"
          >
            {duty.title}
          </Text>
          
          {/* Priority Tag */}
          <Tag color={PRIORITY_COLORS[duty.priority]}>
            {PRIORITY_LABELS[duty.priority]}
          </Tag>
        </div>

        {/* Description */}
        {duty.description && (
          <Text type="secondary" className="duty-item__description">
            {duty.description}
          </Text>
        )}

        {/* Meta Info */}
        <div className="duty-item__meta">
          {/* Status Tag */}
          <Tag color={STATUS_COLORS[duty.status]}>
            {STATUS_LABELS[duty.status]}
          </Tag>

          {/* Dates */}
          {duty.start_date && (
            <Space size={4} className="duty-item__date">
              <CalendarOutlined />
              <Text type="secondary" className="duty-item__date-text">
                {formatDate(duty.start_date)}
                {duty.end_date && ` - ${formatDate(duty.end_date)}`}
              </Text>
            </Space>
          )}

          {/* Completed At */}
          {duty.completed_at && (
            <Text type="success" className="duty-item__completed-date">
              Completed: {formatDate(duty.completed_at)}
            </Text>
          )}
        </div>

        {/* Notes */}
        {duty.notes && (
          <Text type="secondary" className="duty-item__notes">
            {duty.notes}
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className="duty-item__actions">
        <Space>
          <Tooltip title="Edit">
            <button
              type="button"
              className="duty-item__action-btn duty-item__action-btn--edit"
              onClick={handleEdit}
              disabled={isLoading || isDeleting}
              aria-label="Edit duty"
            >
              <EditOutlined />
            </button>
          </Tooltip>
          
          <Popconfirm
            title="Delete this duty?"
            description="This action cannot be undone."
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: isDeleting }}
          >
            <Tooltip title="Delete">
              <button
                type="button"
                className="duty-item__action-btn duty-item__action-btn--delete"
                disabled={isLoading || isDeleting}
                aria-label="Delete duty"
              >
                <DeleteOutlined />
              </button>
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
}

export default DutyItem;
