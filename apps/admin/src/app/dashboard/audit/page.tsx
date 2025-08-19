'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, DatePicker, Select, Input, Tag, Card, Statistic, Row, Col, message, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';
import dayjs from 'dayjs';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  duration?: number;
}

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

export default function AuditPage() {
  const { checkPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null as any,
    action: '',
    resource: '',
    status: '',
    userId: '',
    searchText: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    successRate: 0,
    uniqueUsers: 0
  });

  // 模拟数据
  useEffect(() => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        userId: 'admin001',
        userName: '系统管理员',
        userRole: 'ADMIN',
        action: 'CREATE',
        resource: 'USER',
        resourceId: 'user_123',
        details: '创建新用户: john.doe@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
        timestamp: '2024-01-15T10:30:00Z',
        duration: 245
      },
      {
        id: '2',
        userId: 'analyst001',
        userName: '数据分析师',
        userRole: 'ANALYST',
        action: 'READ',
        resource: 'REPORT',
        resourceId: 'report_456',
        details: '查看AI报告: AAPL技术分析报告',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'success',
        timestamp: '2024-01-15T10:25:00Z',
        duration: 120
      },
      {
        id: '3',
        userId: 'support001',
        userName: '客服专员',
        userRole: 'SUPPORT',
        action: 'UPDATE',
        resource: 'SUBSCRIPTION',
        resourceId: 'sub_789',
        details: '更新用户订阅状态: 从基础版升级到专业版',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
        timestamp: '2024-01-15T10:20:00Z',
        duration: 180
      },
      {
        id: '4',
        userId: 'admin001',
        userName: '系统管理员',
        userRole: 'ADMIN',
        action: 'DELETE',
        resource: 'DATASOURCE',
        resourceId: 'ds_001',
        details: '删除数据源配置: 旧版Yahoo Finance API',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
        timestamp: '2024-01-15T10:15:00Z',
        duration: 95
      },
      {
        id: '5',
        userId: 'analyst002',
        userName: '高级分析师',
        userRole: 'ANALYST',
        action: 'EXPORT',
        resource: 'AUDIT_LOG',
        details: '导出审计日志: 2024年1月1日-15日',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'failed',
        timestamp: '2024-01-15T10:10:00Z',
        duration: 5000
      },
      {
        id: '6',
        userId: 'admin001',
        userName: '系统管理员',
        userRole: 'ADMIN',
        action: 'LOGIN',
        resource: 'AUTH',
        details: '管理员登录系统',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
        timestamp: '2024-01-15T09:00:00Z',
        duration: 1200
      },
      {
        id: '7',
        userId: 'support001',
        userName: '客服专员',
        userRole: 'SUPPORT',
        action: 'CREATE',
        resource: 'WATCHLIST',
        resourceId: 'wl_999',
        details: '为用户创建自选股列表: 科技股组合',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'warning',
        timestamp: '2024-01-15T08:45:00Z',
        duration: 320
      }
    ];

    setAuditLogs(mockLogs);
    setFilteredLogs(mockLogs);

    // 计算统计数据
    const today = dayjs().startOf('day');
    const todayLogs = mockLogs.filter(log => dayjs(log.timestamp).isAfter(today));
    const successLogs = mockLogs.filter(log => log.status === 'success');
    const uniqueUsers = new Set(mockLogs.map(log => log.userId)).size;

    setStats({
      totalLogs: mockLogs.length,
      todayLogs: todayLogs.length,
      successRate: Math.round((successLogs.length / mockLogs.length) * 100),
      uniqueUsers
    });
  }, []);

  // 应用筛选
  useEffect(() => {
    let filtered = [...auditLogs];

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(log => {
        const logDate = dayjs(log.timestamp);
        return logDate.isAfter(start.startOf('day')) && logDate.isBefore(end.endOf('day'));
      });
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
    }

    if (filters.resource) {
      filtered = filtered.filter(log => log.resource.toLowerCase().includes(filters.resource.toLowerCase()));
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.userId) {
      filtered = filtered.filter(log => 
        log.userId.toLowerCase().includes(filters.userId.toLowerCase()) ||
        log.userName.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }

    if (filters.searchText) {
      filtered = filtered.filter(log => 
        log.details.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        log.ipAddress.includes(filters.searchText)
      );
    }

    setFilteredLogs(filtered);
  }, [filters, auditLogs]);

  const getActionColor = (action: string) => {
    const map = {
      CREATE: 'green',
      READ: 'blue',
      UPDATE: 'orange',
      DELETE: 'red',
      LOGIN: 'purple',
      LOGOUT: 'purple',
      EXPORT: 'cyan'
    };
    return map[action as keyof typeof map] || 'default';
  };

  const getStatusColor = (status: string) => {
    const map = {
      success: 'green',
      failed: 'red',
      warning: 'orange'
    };
    return map[status as keyof typeof map] || 'default';
  };

  const getRoleColor = (role: string) => {
    const map = {
      ADMIN: 'red',
      ANALYST: 'blue',
      SUPPORT: 'green'
    };
    return map[role as keyof typeof map] || 'default';
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => (
        <div>
          <div>{dayjs(timestamp).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(timestamp).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a: AuditLog, b: AuditLog) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_, record: AuditLog) => (
        <div>
          <div>{record.userName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Tag color={getRoleColor(record.userRole)} size="small">
              {record.userRole}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      ),
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
      render: (resource: string, record: AuditLog) => (
        <div>
          <div>{resource}</div>
          {record.resourceId && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.resourceId}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: string) => (
        <span title={details}>{details}</span>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'success' ? '成功' : status === 'failed' ? '失败' : '警告'}
        </Tag>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => duration ? `${duration}ms` : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record: AuditLog) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedLog(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  const handleExport = async () => {
    try {
      setLoading(true);
      // TODO: 调用导出API
      const csvContent = [
        ['时间', '用户', '角色', '操作', '资源', '详情', 'IP地址', '状态', '耗时'].join(','),
        ...filteredLogs.map(log => [
          dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          log.userName,
          log.userRole,
          log.action,
          log.resource,
          `"${log.details}"`,
          log.ipAddress,
          log.status,
          log.duration || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('审计日志导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      action: '',
      resource: '',
      status: '',
      userId: '',
      searchText: ''
    });
  };

  return (
    <PermissionGuard permission={Permission.AUDIT_READ}>
      <div>
        <h2>审计日志</h2>
        
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总日志数" value={stats.totalLogs} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="今日日志" value={stats.todayLogs} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="成功率" value={stats.successRate} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="活跃用户" value={stats.uniqueUsers} />
            </Card>
          </Col>
        </Row>

        {/* 筛选器 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="操作类型"
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="CREATE">CREATE</Option>
                <Option value="read">READ</Option>
                <Option value="UPDATE">UPDATE</Option>
                <Option value="DELETE">DELETE</Option>
                <Option value="LOGIN">LOGIN</Option>
                <Option value="LOGOUT">LOGOUT</Option>
                <Option value="EXPORT">EXPORT</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="资源类型"
                value={filters.resource}
                onChange={(value) => setFilters({ ...filters, resource: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="USER">USER</Option>
                <Option value="SUBSCRIPTION">SUBSCRIPTION</Option>
                <Option value="WATCHLIST">WATCHLIST</Option>
                <Option value="REPORT">REPORT</Option>
                <Option value="DATASOURCE">DATASOURCE</Option>
                <Option value="AUTH">AUTH</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="success">成功</Option>
                <Option value="failed">失败</Option>
                <Option value="warning">警告</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Search
                placeholder="搜索用户、详情或IP"
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={4}>
              <Input
                placeholder="用户ID或姓名"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </Col>
            <Col span={20} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<FilterOutlined />} onClick={resetFilters}>
                  重置筛选
                </Button>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  onClick={handleExport}
                  loading={loading}
                >
                  导出日志
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 日志表格 */}
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range?.[0]}-${range?.[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 20
          }}
          scroll={{ x: 1200 }}
        />

        {/* 详情弹窗 */}
        <Modal
          title="审计日志详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={800}
        >
          {selectedLog && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>时间:</strong> {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
                  <p><strong>用户:</strong> {selectedLog.userName} ({selectedLog.userId})</p>
                  <p><strong>角色:</strong> <Tag color={getRoleColor(selectedLog.userRole)}>{selectedLog.userRole}</Tag></p>
                  <p><strong>操作:</strong> <Tag color={getActionColor(selectedLog.action)}>{selectedLog.action}</Tag></p>
                </Col>
                <Col span={12}>
                  <p><strong>资源:</strong> {selectedLog.resource}</p>
                  {selectedLog.resourceId && <p><strong>资源ID:</strong> {selectedLog.resourceId}</p>}
                  <p><strong>状态:</strong> <Tag color={getStatusColor(selectedLog.status)}>
                    {selectedLog.status === 'success' ? '成功' : selectedLog.status === 'failed' ? '失败' : '警告'}
                  </Tag></p>
                  <p><strong>耗时:</strong> {selectedLog.duration ? `${selectedLog.duration}ms` : '-'}</p>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <p><strong>详情:</strong></p>
                  <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                    {selectedLog.details}
                  </div>
                </Col>
              </Row>
              <Row style={{ marginTop: 16 }}>
                <Col span={12}>
                  <p><strong>IP地址:</strong> {selectedLog.ipAddress}</p>
                </Col>
                <Col span={12}>
                  <p><strong>User Agent:</strong></p>
                  <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}