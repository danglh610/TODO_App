/**
 * DutyList Component
 */

import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Typography, Spin, Alert, Empty, Card, Pagination, ConfigProvider, theme } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { dutyService } from '../../services/dutyService';
import type { Duty, DutyStatus, DutyPriority } from '../../types/duty';
import { DutyItem } from '../DutyItem/DutyItem';
import './DutyList.css';

const { Title, Text } = Typography;
const PAGE_SIZE = 10;

const antdTheme = { algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#3b82f6', borderRadius: 8 } };

function DutyListInner({ initialStatus, initialPriority }: { initialStatus?: DutyStatus; initialPriority?: DutyPriority }) {
  const navigate = useNavigate();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DutyStatus | ''>(initialStatus || '');
  const [priorityFilter, setPriorityFilter] = useState<DutyPriority | ''>(initialPriority || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  const fetchDuties = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dutyService.getDuties({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchTerm || undefined
      });
      if (result.success && result.data) {
        setDuties(result.data);
        setTotalCount(result.total || 0);
        setCurrentPage(page);
      } else {
        throw new Error(result.error || 'Failed to fetch duties');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    fetchDuties(1);
  }, [statusFilter, priorityFilter]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this duty?')) return;
    setLoadingItemId(id);
    try {
      const result = await dutyService.deleteDuty(id);
      if (result.success) {
        await fetchDuties(currentPage);
      } else {
        throw new Error(result.error || 'Failed to delete duty');
      }
    } finally {
      setLoadingItemId(null);
    }
  }, [currentPage, fetchDuties]);

  const handleEdit = useCallback((duty: Duty) => {
    navigate(`/duty/edit/${duty.id}`);
  }, [navigate]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = useCallback((page: number) => {
    fetchDuties(page);
  }, [fetchDuties]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchQuery);
      setCurrentPage(1);
      fetchDuties(1);
    }
  }, [searchQuery, fetchDuties]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as DutyStatus | '');
    setCurrentPage(1);
  }, []);

  const handlePriorityChange = useCallback((value: string) => {
    setPriorityFilter(value as DutyPriority | '');
    setCurrentPage(1);
  }, []);

  return (
    <div className="duty-list">
      <header className="duty-list__header">
        <div className="duty-list__header-content">
          <Title level={2} className="duty-list__title">My Duties</Title>
          <Text type="secondary">
            {totalCount > 0 ? `${totalCount} dut${totalCount !== 1 ? 'ies' : 'y'} total` : 'No duties yet'}
          </Text>
        </div>
        <Link to="/duty/new">
          <Button type="primary" icon={<PlusOutlined />} size="large">New Duty</Button>
        </Link>
      </header>

      <Card className="duty-list__filters" bordered={false}>
        <div className="duty-list__filters-row">
          <div className="duty-list__filter-group">
            <Text type="secondary">Status</Text>
            <Select value={statusFilter} onChange={handleStatusChange} style={{ width: '100%' }} allowClear>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </div>
          <div className="duty-list__filter-group">
            <Text type="secondary">Priority</Text>
            <Select value={priorityFilter} onChange={handlePriorityChange} style={{ width: '100%' }} allowClear>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </div>
          <div className="duty-list__filter-group">
            <Text type="secondary">Search</Text>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              allowClear
            />
          </div>
        </div>
      </Card>

      <div className="duty-list__content">
        {loading && (
          <div className="duty-list__loading">
            <Spin size="large" />
            <Text type="secondary">Loading...</Text>
          </div>
        )}
        {error && !loading && (
          <Alert
            type="error"
            message="Error"
            description={error}
            action={<Button size="small" icon={<ReloadOutlined />} onClick={() => fetchDuties(currentPage)}>Retry</Button>}
            showIcon
          />
        )}
        {!loading && !error && duties.length === 0 && (
          <Card className="duty-list__empty-card" bordered={false}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchQuery || statusFilter || priorityFilter ? 'No duties match your filters' : 'No duties yet'}
            >
              {!searchQuery && !statusFilter && !priorityFilter && (
                <Link to="/duty/new">
                  <Button type="primary" icon={<PlusOutlined />}>Create First Duty</Button>
                </Link>
              )}
            </Empty>
          </Card>
        )}
        {!loading && !error && duties.length > 0 && (
          <>
            <div className="duty-list__items">
              {duties.map((duty) => (
                <Card key={duty.id} className="duty-list__item-card" bordered={false} hoverable>
                  <DutyItem
                    duty={duty}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={loadingItemId === duty.id}
                  />
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="duty-list__pagination">
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DutyList(props: { initialStatus?: DutyStatus; initialPriority?: DutyPriority }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <DutyListInner {...props} />
    </ConfigProvider>
  );
}

export default DutyList;