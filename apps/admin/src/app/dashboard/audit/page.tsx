'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  Input,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Modal,
  Tooltip,
  Switch,
  Badge,
  Drawer,
  Form,
  Checkbox,
  Radio,
  Divider,
  Typography,
  Alert,
  Tabs,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined,
  ExportOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

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
const { Title, Text } = Typography;

export default function AuditPage() {
  const { checkPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportLoading, setExportLoading] = useState(false);
  const [chartsVisible, setChartsVisible] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('trend');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState({
    dateRange: null as any,
    action: '',
    resource: '',
    status: '',
    userId: '',
    searchText: '',
    // 高级筛选选项
    ipAddress: '',
    userAgent: '',
    durationMin: '',
    durationMax: '',
    resourceId: '',
    roles: [] as string[],
    actions: [] as string[],
    resources: [] as string[],
    statuses: [] as string[],
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    successRate: 0,
    uniqueUsers: 0,
    avgDuration: 0,
    failedLogs: 0,
  });

  // 生成更丰富的模拟审计日志数据
  const generateMockAuditLogs = useCallback(
    (count: number = 50): AuditLog[] => {
      const actions = [
        'LOGIN',
        'LOGOUT',
        'READ',
        'CREATE',
        'UPDATE',
        'DELETE',
        'EXPORT',
        'IMPORT',
      ];
      const resources = [
        'AUTH',
        'USER',
        'DATASOURCE',
        'AUDIT_LOG',
        'ROLE',
        'PERMISSION',
        'REPORT',
        'SUBSCRIPTION',
        'WATCHLIST',
      ];
      const statuses: ('success' | 'failed' | 'warning')[] = [
        'success',
        'failed',
        'warning',
      ];
      const users = [
        { id: 'admin001', name: '系统管理员', role: 'ADMIN' },
        { id: 'analyst001', name: '数据分析师', role: 'ANALYST' },
        { id: 'analyst002', name: '高级分析师', role: 'ANALYST' },
        { id: 'support001', name: '客服专员', role: 'SUPPORT' },
        { id: 'support002', name: '技术支持', role: 'SUPPORT' },
        { id: 'manager001', name: '产品经理', role: 'ADMIN' },
      ];
      const ips = [
        '192.168.1.100',
        '192.168.1.101',
        '192.168.1.102',
        '10.0.0.50',
        '172.16.0.10',
      ];

      return Array.from({ length: count }, (_, index) => {
        const timestamp = dayjs()
          .subtract(Math.floor(Math.random() * 30), 'day')
          .subtract(Math.floor(Math.random() * 24), 'hour')
          .subtract(Math.floor(Math.random() * 60), 'minute');

        const action = actions[Math.floor(Math.random() * actions.length)];
        const resource =
          resources[Math.floor(Math.random() * resources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const ipAddress = ips[Math.floor(Math.random() * ips.length)];

        return {
          id: `log_${index + 1}`,
          timestamp: timestamp.toISOString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action,
          resource,
          resourceId:
            Math.random() > 0.5
              ? `${resource.toLowerCase()}_${Math.floor(Math.random() * 1000)}`
              : undefined,
          details: `${action.toLowerCase()} ${resource.toLowerCase()} - ${Math.random() > 0.5 ? '操作成功' : '操作详情'}`,
          ipAddress,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status,
          duration: Math.floor(Math.random() * 500) + 50,
        };
      });
    },
    []
  );

  // 模拟数据
  useEffect(() => {
    const mockLogs = generateMockAuditLogs(50);

    setAuditLogs(mockLogs);
    setFilteredLogs(mockLogs);

    // 计算统计数据
    const today = dayjs().startOf('day');
    const todayLogs = mockLogs.filter(log =>
      dayjs(log.timestamp).isAfter(today)
    );
    const successLogs = mockLogs.filter(log => log.status === 'success');
    const failedLogs = mockLogs.filter(log => log.status === 'failed');
    const uniqueUsers = new Set(mockLogs.map(log => log.userId)).size;
    const avgDuration =
      mockLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
      mockLogs.length;

    setStats({
      totalLogs: mockLogs.length,
      todayLogs: todayLogs.length,
      successRate: Math.round((successLogs.length / mockLogs.length) * 100),
      uniqueUsers,
      avgDuration: Math.round(avgDuration),
      failedLogs: failedLogs.length,
    });
  }, []);

  // 实时刷新功能
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      const newLogs = generateMockAuditLogs(50);
      setAuditLogs(newLogs);
      setLastRefresh(dayjs().format('HH:mm:ss'));

      // 更新统计数据
      const today = dayjs().startOf('day');
      const todayLogs = newLogs.filter(log =>
        dayjs(log.timestamp).isAfter(today)
      );
      const successLogs = newLogs.filter(log => log.status === 'success');
      const failedLogs = newLogs.filter(log => log.status === 'failed');
      const uniqueUsers = new Set(newLogs.map(log => log.userId)).size;
      const avgDuration =
        newLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
        newLogs.length;

      setStats({
        totalLogs: newLogs.length,
        todayLogs: todayLogs.length,
        successRate: Math.round((successLogs.length / newLogs.length) * 100),
        uniqueUsers,
        avgDuration: Math.round(avgDuration),
        failedLogs: failedLogs.length,
      });

      message.success('数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setLoading(false);
    }
  }, [generateMockAuditLogs]);

  // 自动刷新设置
  useEffect(() => {
    if (realTimeEnabled && autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshData();
      }, autoRefreshInterval * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeEnabled, autoRefreshInterval, refreshData]);

  // 高级筛选逻辑
  const applyFilters = useCallback(
    (logs: AuditLog[]) => {
      let filtered = logs;

      // 基础筛选
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [start, end] = filters.dateRange;
        filtered = filtered.filter(log => {
          const logDate = dayjs(log.timestamp);
          return (
            logDate.isAfter(start.startOf('day')) &&
            logDate.isBefore(end.endOf('day'))
          );
        });
      }

      if (filters.action) {
        filtered = filtered.filter(log => log.action === filters.action);
      }

      if (filters.resource) {
        filtered = filtered.filter(log => log.resource === filters.resource);
      }

      if (filters.status) {
        filtered = filtered.filter(log => log.status === filters.status);
      }

      if (filters.userId) {
        filtered = filtered.filter(
          log =>
            log.userId.toLowerCase().includes(filters.userId.toLowerCase()) ||
            (log.userName &&
              log.userName.toLowerCase().includes(filters.userId.toLowerCase()))
        );
      }

      // 高级筛选
      if (filters.ipAddress) {
        filtered = filtered.filter(log =>
          log.ipAddress.includes(filters.ipAddress)
        );
      }

      if (filters.userAgent) {
        filtered = filtered.filter(log =>
          log.userAgent.toLowerCase().includes(filters.userAgent.toLowerCase())
        );
      }

      if (filters.durationMin) {
        const minDuration = parseInt(filters.durationMin);
        filtered = filtered.filter(log => (log.duration || 0) >= minDuration);
      }

      if (filters.durationMax) {
        const maxDuration = parseInt(filters.durationMax);
        filtered = filtered.filter(log => (log.duration || 0) <= maxDuration);
      }

      if (filters.resourceId) {
        filtered = filtered.filter(
          log =>
            log.resourceId &&
            log.resourceId
              .toLowerCase()
              .includes(filters.resourceId.toLowerCase())
        );
      }

      // 多选筛选
      if (filters.actions.length > 0) {
        filtered = filtered.filter(log => filters.actions.includes(log.action));
      }

      if (filters.resources.length > 0) {
        filtered = filtered.filter(log =>
          filters.resources.includes(log.resource)
        );
      }

      if (filters.statuses.length > 0) {
        filtered = filtered.filter(log =>
          filters.statuses.includes(log.status)
        );
      }

      if (filters.roles.length > 0) {
        filtered = filtered.filter(
          log => log.userRole && filters.roles.includes(log.userRole)
        );
      }

      // 搜索文本筛选
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filtered = filtered.filter(
          log =>
            log.details.toLowerCase().includes(searchLower) ||
            log.userId.toLowerCase().includes(searchLower) ||
            (log.userName &&
              log.userName.toLowerCase().includes(searchLower)) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.resource.toLowerCase().includes(searchLower) ||
            log.ipAddress.includes(searchLower) ||
            (log.resourceId &&
              log.resourceId.toLowerCase().includes(searchLower))
        );
      }

      return filtered;
    },
    [filters]
  );

  // 应用筛选
  useEffect(() => {
    const filtered = applyFilters(auditLogs);
    setFilteredLogs(filtered);
  }, [auditLogs, applyFilters]);

  const getActionColor = (action: string) => {
    const map = {
      CREATE: 'green',
      READ: 'blue',
      UPDATE: 'orange',
      DELETE: 'red',
      LOGIN: 'purple',
      LOGOUT: 'purple',
      EXPORT: 'cyan',
    };
    return map[action as keyof typeof map] || 'default';
  };

  const getStatusColor = (status: string) => {
    const map = {
      success: 'green',
      failed: 'red',
      warning: 'orange',
    };
    return map[status as keyof typeof map] || 'default';
  };

  const getRoleColor = (role: string) => {
    const map = {
      ADMIN: 'red',
      ANALYST: 'blue',
      SUPPORT: 'green',
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
      sorter: (a: AuditLog, b: AuditLog) =>
        dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
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
            <Tag color={getRoleColor(record.userRole)} size='small'>
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
        <Tag color={getActionColor(action)}>{action}</Tag>
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
      render: (details: string) => <span title={details}>{details}</span>,
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
          {status === 'success'
            ? '成功'
            : status === 'failed'
              ? '失败'
              : '警告'}
        </Tag>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => (duration ? `${duration}ms` : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record: AuditLog) => (
        <Button
          type='link'
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

  // 导出功能
  const handleExport = async (format: 'csv' | 'json' = exportFormat) => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟导出处理时间

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `audit_logs_${timestamp}`;

      if (format === 'csv') {
        const csvContent = [
          [
            '时间',
            '用户ID',
            '用户名',
            '角色',
            '操作',
            '资源',
            '资源ID',
            '详情',
            'IP地址',
            '用户代理',
            '状态',
            '耗时(ms)',
          ],
          ...filteredLogs.map(log => [
            dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
            log.userId,
            log.userName || '',
            log.userRole || '',
            log.action,
            log.resource,
            log.resourceId || '',
            log.details,
            log.ipAddress,
            log.userAgent,
            log.status === 'success'
              ? '成功'
              : log.status === 'failed'
                ? '失败'
                : '警告',
            log.duration?.toString() || '',
          ]),
        ]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const jsonData = {
          exportTime: dayjs().toISOString(),
          totalRecords: filteredLogs.length,
          filters: filters,
          data: filteredLogs.map(log => ({
            ...log,
            timestamp: dayjs(log.timestamp).toISOString(),
            statusText:
              log.status === 'success'
                ? '成功'
                : log.status === 'failed'
                  ? '失败'
                  : '警告',
          })),
        };

        const jsonContent = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonContent], {
          type: 'application/json;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      message.success(`审计日志导出成功 (${format.toUpperCase()})`);
    } catch (error) {
      message.error('导出失败，请重试');
    } finally {
      setExportLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      action: '',
      resource: '',
      status: '',
      userId: '',
      searchText: '',
      // 高级筛选选项
      ipAddress: '',
      userAgent: '',
      durationMin: '',
      durationMax: '',
      resourceId: '',
      roles: [] as string[],
      actions: [] as string[],
      resources: [] as string[],
      statuses: [] as string[],
    });
  };

  return (
    <PermissionGuard permission={Permission.AUDIT_READ}>
      <div>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <h2>审计日志</h2>
              {lastRefresh && (
                <Text
                  type='secondary'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  最后更新: {lastRefresh}
                </Text>
              )}
            </div>
            <Space>
              <Tooltip
                title={realTimeEnabled ? '关闭实时刷新' : '开启实时刷新'}
              >
                <Switch
                  checked={realTimeEnabled}
                  onChange={setRealTimeEnabled}
                  checkedChildren={<SyncOutlined spin />}
                  unCheckedChildren={<SyncOutlined />}
                />
              </Tooltip>
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshData}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        {/* 统计卡片 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            审计日志统计
          </Title>
          <Button
            icon={chartsVisible ? <BarChartOutlined /> : <LineChartOutlined />}
            onClick={() => setChartsVisible(!chartsVisible)}
          >
            {chartsVisible ? '隐藏图表' : '显示图表'}
          </Button>
        </div>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic title='总日志数' value={stats.totalLogs} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title='今日日志' value={stats.todayLogs} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title='成功率'
                value={stats.successRate}
                suffix='%'
                valueStyle={{
                  color:
                    stats.successRate >= 90
                      ? '#3f8600'
                      : stats.successRate >= 70
                        ? '#faad14'
                        : '#cf1322',
                }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title='活跃用户' value={stats.uniqueUsers} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title='平均耗时'
                value={stats.avgDuration}
                suffix='ms'
                valueStyle={{
                  color:
                    stats.avgDuration <= 200
                      ? '#3f8600'
                      : stats.avgDuration <= 500
                        ? '#faad14'
                        : '#cf1322',
                }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title='失败日志'
                value={stats.failedLogs}
                valueStyle={{
                  color: stats.failedLogs > 0 ? '#cf1322' : '#3f8600',
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 统计图表 */}
        {chartsVisible && (
          <Card style={{ marginBottom: 16 }}>
            <Tabs
              activeKey={activeChartTab}
              onChange={setActiveChartTab}
              items={[
                {
                  key: 'trend',
                  label: (
                    <span>
                      <LineChartOutlined />
                      操作趋势
                    </span>
                  ),
                  children: (
                    <div
                      style={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fafafa',
                        border: '1px dashed #d9d9d9',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <LineChartOutlined
                          style={{
                            fontSize: 48,
                            color: '#d9d9d9',
                            marginBottom: 16,
                          }}
                        />
                        <div style={{ color: '#999' }}>24小时操作趋势图</div>
                        <div
                          style={{ color: '#666', fontSize: 12, marginTop: 8 }}
                        >
                          显示过去24小时内的操作数量变化趋势
                        </div>
                        <div style={{ marginTop: 16, fontSize: 12 }}>
                          {chartData.trendData.slice(-6).map((item, index) => (
                            <span
                              key={index}
                              style={{ marginRight: 16, color: '#666' }}
                            >
                              {item.time}: {item.total}次
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'resource',
                  label: (
                    <span>
                      <PieChartOutlined />
                      资源分布
                    </span>
                  ),
                  children: (
                    <div style={{ height: 300 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div
                            style={{
                              height: 280,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fafafa',
                              border: '1px dashed #d9d9d9',
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <PieChartOutlined
                                style={{
                                  fontSize: 48,
                                  color: '#d9d9d9',
                                  marginBottom: 16,
                                }}
                              />
                              <div style={{ color: '#999' }}>
                                资源访问分布图
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ padding: 16 }}>
                            <Title level={5}>资源访问统计</Title>
                            {chartData.resourceChartData
                              .slice(0, 8)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                    padding: '4px 0',
                                  }}
                                >
                                  <span>{item.type}</span>
                                  <span style={{ fontWeight: 'bold' }}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'action',
                  label: (
                    <span>
                      <BarChartOutlined />
                      操作类型
                    </span>
                  ),
                  children: (
                    <div style={{ height: 300 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div
                            style={{
                              height: 280,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fafafa',
                              border: '1px dashed #d9d9d9',
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <BarChartOutlined
                                style={{
                                  fontSize: 48,
                                  color: '#d9d9d9',
                                  marginBottom: 16,
                                }}
                              />
                              <div style={{ color: '#999' }}>
                                操作类型分布图
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ padding: 16 }}>
                            <Title level={5}>操作类型统计</Title>
                            {chartData.actionChartData
                              .slice(0, 8)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                    padding: '4px 0',
                                  }}
                                >
                                  <span>{item.type}</span>
                                  <span style={{ fontWeight: 'bold' }}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: (
                    <span>
                      <PieChartOutlined />
                      状态分布
                    </span>
                  ),
                  children: (
                    <div style={{ height: 300 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div
                            style={{
                              height: 280,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fafafa',
                              border: '1px dashed #d9d9d9',
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <PieChartOutlined
                                style={{
                                  fontSize: 48,
                                  color: '#d9d9d9',
                                  marginBottom: 16,
                                }}
                              />
                              <div style={{ color: '#999' }}>
                                操作状态分布图
                              </div>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ padding: 16 }}>
                            <Title level={5}>状态统计</Title>
                            {chartData.statusChartData.map((item, index) => {
                              const color =
                                item.type === '成功'
                                  ? '#52c41a'
                                  : item.type === '失败'
                                    ? '#ff4d4f'
                                    : '#faad14';
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12,
                                    padding: '8px 0',
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                        marginRight: 8,
                                      }}
                                    ></div>
                                    {item.type}
                                  </span>
                                  <span style={{ fontWeight: 'bold', color }}>
                                    {item.value}
                                  </span>
                                </div>
                              );
                            })}
                            <div
                              style={{
                                marginTop: 16,
                                padding: '8px 0',
                                borderTop: '1px solid #f0f0f0',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>成功率</span>
                                <span
                                  style={{
                                    fontWeight: 'bold',
                                    color:
                                      stats.successRate >= 90
                                        ? '#52c41a'
                                        : stats.successRate >= 70
                                          ? '#faad14'
                                          : '#ff4d4f',
                                  }}
                                >
                                  {stats.successRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )}

        {/* 筛选器 */}
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              筛选条件
            </Title>
            <Space>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setAdvancedFilterVisible(true)}
              >
                高级筛选
              </Button>
              <Button onClick={resetFilters}>重置筛选</Button>
              <Button.Group>
                <Button
                  type={exportFormat === 'csv' ? 'primary' : 'default'}
                  icon={<FileExcelOutlined />}
                  onClick={() => setExportFormat('csv')}
                >
                  CSV
                </Button>
                <Button
                  type={exportFormat === 'json' ? 'primary' : 'default'}
                  icon={<FileTextOutlined />}
                  onClick={() => setExportFormat('json')}
                >
                  JSON
                </Button>
              </Button.Group>
              <Button
                type='primary'
                icon={<ExportOutlined />}
                onClick={() => handleExport()}
                loading={exportLoading}
                disabled={filteredLogs.length === 0}
              >
                导出 ({filteredLogs.length})
              </Button>
            </Space>
          </div>

          <Row gutter={16}>
            <Col span={6}>
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                value={filters.dateRange}
                onChange={dates => setFilters({ ...filters, dateRange: dates })}
                style={{ width: '100%' }}
                showTime
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder='操作类型'
                value={filters.action}
                onChange={value => setFilters({ ...filters, action: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value='LOGIN'>登录</Option>
                <Option value='LOGOUT'>登出</Option>
                <Option value='read'>查看</Option>
                <Option value='CREATE'>创建</Option>
                <Option value='UPDATE'>更新</Option>
                <Option value='DELETE'>删除</Option>
                <Option value='EXPORT'>导出</Option>
                <Option value='IMPORT'>导入</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder='资源类型'
                value={filters.resource}
                onChange={value => setFilters({ ...filters, resource: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value='AUTH'>认证</Option>
                <Option value='USER'>用户</Option>
                <Option value='DATASOURCE'>数据源</Option>
                <Option value='AUDIT_LOG'>审计日志</Option>
                <Option value='ROLE'>角色</Option>
                <Option value='PERMISSION'>权限</Option>
                <Option value='REPORT'>报告</Option>
                <Option value='SUBSCRIPTION'>订阅</Option>
                <Option value='WATCHLIST'>自选股</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder='状态'
                value={filters.status}
                onChange={value => setFilters({ ...filters, status: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value='success'>成功</Option>
                <Option value='failed'>失败</Option>
                <Option value='warning'>警告</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Search
                placeholder='搜索用户、操作、资源或详情'
                value={filters.searchText}
                onChange={e =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>

          {realTimeEnabled && (
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Alert
                  message={`实时刷新已开启，每 ${autoRefreshInterval} 秒自动更新数据`}
                  type='info'
                  showIcon
                  closable={false}
                  action={
                    <Select
                      size='small'
                      value={autoRefreshInterval}
                      onChange={setAutoRefreshInterval}
                      style={{ width: 80 }}
                    >
                      <Option value={10}>10s</Option>
                      <Option value={30}>30s</Option>
                      <Option value={60}>60s</Option>
                      <Option value={300}>5m</Option>
                    </Select>
                  }
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* 日志表格 */}
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey='id'
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range?.[0]}-${range?.[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 20,
          }}
          scroll={{ x: 1200 }}
        />

        {/* 高级筛选抽屉 */}
        <Drawer
          title='高级筛选'
          placement='right'
          width={400}
          open={advancedFilterVisible}
          onClose={() => setAdvancedFilterVisible(false)}
          extra={
            <Space>
              <Button onClick={resetFilters}>重置</Button>
              <Button
                type='primary'
                onClick={() => setAdvancedFilterVisible(false)}
              >
                应用筛选
              </Button>
            </Space>
          }
        >
          <Form layout='vertical'>
            <Form.Item label='IP地址'>
              <Input
                placeholder='输入IP地址'
                value={filters.ipAddress}
                onChange={e =>
                  setFilters({ ...filters, ipAddress: e.target.value })
                }
              />
            </Form.Item>

            <Form.Item label='用户代理'>
              <Input
                placeholder='输入用户代理信息'
                value={filters.userAgent}
                onChange={e =>
                  setFilters({ ...filters, userAgent: e.target.value })
                }
              />
            </Form.Item>

            <Form.Item label='资源ID'>
              <Input
                placeholder='输入资源ID'
                value={filters.resourceId}
                onChange={e =>
                  setFilters({ ...filters, resourceId: e.target.value })
                }
              />
            </Form.Item>

            <Form.Item label='耗时范围 (ms)'>
              <Row gutter={8}>
                <Col span={12}>
                  <Input
                    placeholder='最小值'
                    type='number'
                    value={filters.durationMin}
                    onChange={e =>
                      setFilters({ ...filters, durationMin: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder='最大值'
                    type='number'
                    value={filters.durationMax}
                    onChange={e =>
                      setFilters({ ...filters, durationMax: e.target.value })
                    }
                  />
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label='用户角色'>
              <Checkbox.Group
                value={filters.roles}
                onChange={values => setFilters({ ...filters, roles: values })}
              >
                <Row>
                  <Col span={24}>
                    <Checkbox value='ADMIN'>管理员</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='ANALYST'>分析师</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='SUPPORT'>支持</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label='操作类型'>
              <Checkbox.Group
                value={filters.actions}
                onChange={values => setFilters({ ...filters, actions: values })}
              >
                <Row>
                  <Col span={24}>
                    <Checkbox value='LOGIN'>登录</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='LOGOUT'>登出</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='READ'>查看</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='CREATE'>创建</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='UPDATE'>更新</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='DELETE'>删除</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='EXPORT'>导出</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='IMPORT'>导入</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label='资源类型'>
              <Checkbox.Group
                value={filters.resources}
                onChange={values =>
                  setFilters({ ...filters, resources: values })
                }
              >
                <Row>
                  <Col span={24}>
                    <Checkbox value='AUTH'>认证</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='USER'>用户</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='DATASOURCE'>数据源</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='AUDIT_LOG'>审计日志</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='ROLE'>角色</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='PERMISSION'>权限</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='REPORT'>报告</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='SUBSCRIPTION'>订阅</Checkbox>
                  </Col>
                  <Col span={24}>
                    <Checkbox value='WATCHLIST'>自选股</Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label='状态'>
              <Radio.Group
                value={filters.status}
                onChange={e =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <Radio value=''>全部</Radio>
                <Radio value='success'>成功</Radio>
                <Radio value='failed'>失败</Radio>
                <Radio value='warning'>警告</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Drawer>

        {/* 详情弹窗 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InfoCircleOutlined />
              <span>审计日志详情</span>
              {selectedLog && (
                <Tag
                  color={getStatusColor(selectedLog.status)}
                  style={{ marginLeft: '8px' }}
                >
                  {selectedLog.status === 'success'
                    ? '成功'
                    : selectedLog.status === 'failed'
                      ? '失败'
                      : '警告'}
                </Tag>
              )}
            </div>
          }
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={[
            <Button
              key='export'
              icon={<ExportOutlined />}
              onClick={() => {
                if (selectedLog) {
                  const data = JSON.stringify(selectedLog, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit-log-${selectedLog.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  message.success('日志详情已导出');
                }
              }}
            >
              导出详情
            </Button>,
            <Button
              key='close'
              type='primary'
              onClick={() => setSelectedLog(null)}
            >
              关闭
            </Button>,
          ]}
          width={900}
        >
          {selectedLog && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <p>
                    <strong>时间:</strong>{' '}
                    {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                  <p>
                    <strong>用户:</strong> {selectedLog.userName} (
                    {selectedLog.userId})
                  </p>
                  <p>
                    <strong>角色:</strong>{' '}
                    <Tag color={getRoleColor(selectedLog.userRole)}>
                      {selectedLog.userRole}
                    </Tag>
                  </p>
                  <p>
                    <strong>操作:</strong>{' '}
                    <Tag color={getActionColor(selectedLog.action)}>
                      {selectedLog.action}
                    </Tag>
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>资源:</strong> {selectedLog.resource}
                  </p>
                  {selectedLog.resourceId && (
                    <p>
                      <strong>资源ID:</strong> {selectedLog.resourceId}
                    </p>
                  )}
                  <p>
                    <strong>状态:</strong>{' '}
                    <Tag color={getStatusColor(selectedLog.status)}>
                      {selectedLog.status === 'success'
                        ? '成功'
                        : selectedLog.status === 'failed'
                          ? '失败'
                          : '警告'}
                    </Tag>
                  </p>
                  <p>
                    <strong>耗时:</strong>{' '}
                    {selectedLog.duration ? `${selectedLog.duration}ms` : '-'}
                  </p>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <p>
                    <strong>详情:</strong>
                  </p>
                  <div
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '4px',
                    }}
                  >
                    {selectedLog.details}
                  </div>
                </Col>
              </Row>
              <Row style={{ marginTop: 16 }}>
                <Col span={12}>
                  <p>
                    <strong>IP地址:</strong> {selectedLog.ipAddress}
                  </p>
                </Col>
                <Col span={12}>
                  <p>
                    <strong>User Agent:</strong>
                  </p>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      wordBreak: 'break-all',
                    }}
                  >
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
