'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Alert,
  Spin,
  Progress,
  List,
  Avatar,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  StockOutlined,
  FileTextOutlined,
  EyeOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import DisclaimerNotice from '@/components/DisclaimerNotice';
import { Disclaimer, DataSourceHint } from '@/components/compliance';
// 临时类型定义，后续应该从共享类型中导入
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  createdAt: string;
  updatedAt: string;
}

interface AIReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalStocks: number;
  totalReports: number;
  userGrowth: number;
  stockGrowth: number;
  reportGrowth: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStocks: 0,
    totalReports: 0,
    userGrowth: 0,
    stockGrowth: 0,
    reportGrowth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [popularStocks, setPopularStocks] = useState<Stock[]>([]);
  const [recentReports, setRecentReports] = useState<AIReport[]>([]);

  // 加载仪表板数据
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // 模拟数据加载（实际项目中应该调用真实的 API）
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 设置模拟统计数据
        setStats({
          totalUsers: 1248,
          activeUsers: 892,
          totalStocks: 4567,
          totalReports: 328,
          userGrowth: 12.5,
          stockGrowth: 8.3,
          reportGrowth: 15.7,
        });

        // 设置模拟用户数据
        setRecentUsers([
          {
            id: '1',
            email: 'user1@example.com',
            name: '张三',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            email: 'user2@example.com',
            name: '李四',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            email: 'user3@example.com',
            name: '王五',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);

        // 设置模拟股票数据
        setPopularStocks([
          {
            id: '1',
            symbol: '000001',
            name: '平安银行',
            currentPrice: 12.45,
            changePercent: 2.34,
            volume: 1234567,
            marketCap: 2345678901,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            symbol: '000002',
            name: '万科A',
            currentPrice: 18.76,
            changePercent: -1.23,
            volume: 987654,
            marketCap: 1876543210,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);

        // 设置模拟报告数据
        setRecentReports([
          {
            id: '1',
            title: '市场趋势分析报告',
            summary: '本周A股市场整体表现良好，科技股领涨...',
            content: '详细分析内容...',
            type: 'market_analysis',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: '个股推荐报告',
            summary: '基于AI分析，推荐以下优质个股...',
            content: '详细推荐内容...',
            type: 'stock_recommendation',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // 股票表格列配置
  const stockColumns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <Text strong className='font-mono'>
          {symbol}
        </Text>
      ),
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => <Text strong>¥{price.toFixed(2)}</Text>,
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      render: (change: number) => {
        const isPositive = change > 0;
        const isNegative = change < 0;
        return (
          <Tag
            color={isPositive ? 'red' : isNegative ? 'green' : 'default'}
            icon={
              isPositive ? (
                <ArrowUpOutlined />
              ) : isNegative ? (
                <ArrowDownOutlined />
              ) : null
            }
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}%
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type='link' size='small' icon={<EyeOutlined />}>
          查看详情
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <Spin size='large' tip='加载中...' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 页面标题 */}
      <div className='flex items-center justify-between'>
        <div>
          <Title level={2} className='!mb-2'>
            仪表板
          </Title>
          <Text type='secondary'>欢迎使用古灵通管理后台，这里是系统概览</Text>
        </div>
        <Button type='primary' icon={<RiseOutlined />}>
          查看详细报告
        </Button>
      </div>

      {/* 系统状态提醒 */}
      <Alert
        message='系统运行正常'
        description='所有服务运行正常，数据同步正常，API 响应时间良好。'
        type='success'
        showIcon
        closable
      />

      {/* 合规组件 */}
      <div className='space-y-4'>
        <Disclaimer
          type='investment'
          position='inline'
          theme='light'
          showIcon={true}
          closable={true}
        />
        <DataSourceHint
          type='realtime'
          position='inline'
          theme='light'
          showIcon={true}
          closable={true}
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='总用户数'
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <Tag color={stats.userGrowth > 0 ? 'red' : 'green'}>
                  {stats.userGrowth > 0 ? '+' : ''}
                  {stats.userGrowth}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='活跃用户'
              value={stats.activeUsers}
              prefix={<UserOutlined />}
              suffix={
                <Progress
                  type='circle'
                  size={24}
                  percent={Math.round(
                    (stats.activeUsers / stats.totalUsers) * 100
                  )}
                  showInfo={false}
                />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='股票总数'
              value={stats.totalStocks}
              prefix={<StockOutlined />}
              suffix={
                <Tag color={stats.stockGrowth > 0 ? 'red' : 'green'}>
                  {stats.stockGrowth > 0 ? '+' : ''}
                  {stats.stockGrowth}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title='AI 报告'
              value={stats.totalReports}
              prefix={<FileTextOutlined />}
              suffix={
                <Tag color={stats.reportGrowth > 0 ? 'red' : 'green'}>
                  {stats.reportGrowth > 0 ? '+' : ''}
                  {stats.reportGrowth}%
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 热门股票 */}
        <Col xs={24} lg={14}>
          <Card
            title='热门股票'
            extra={
              <Button type='link' size='small'>
                查看全部
              </Button>
            }
          >
            <Table
              dataSource={popularStocks}
              columns={stockColumns}
              pagination={false}
              size='small'
              rowKey='id'
            />
          </Card>
        </Col>

        {/* 最新用户 */}
        <Col xs={24} lg={10}>
          <Card
            title='最新用户'
            extra={
              <Button type='link' size='small'>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentUsers}
              renderItem={user => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={user.avatar}
                        icon={<UserOutlined />}
                        className='bg-primary'
                      />
                    }
                    title={user.name || user.email}
                    description={
                      <Space>
                        <Text type='secondary' className='text-xs'>
                          {user.email}
                        </Text>
                        <Text type='secondary' className='text-xs'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 最新报告 */}
      <Row>
        <Col span={24}>
          <Card
            title='最新 AI 报告'
            extra={
              <Button type='link' size='small'>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentReports}
              renderItem={report => (
                <List.Item
                  actions={[
                    <Button
                      key='view'
                      type='link'
                      size='small'
                      icon={<EyeOutlined />}
                    >
                      查看
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<FileTextOutlined />}
                        className='bg-blue-500'
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{report.title}</Text>
                        <Tag color='blue'>{report.type}</Tag>
                        <Tag color='green'>{report.status}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type='secondary'>{report.summary}</Text>
                        <br />
                        <Text type='secondary' className='text-xs'>
                          {new Date(report.createdAt).toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
