'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Tabs,
  Switch,
  Card,
  Tooltip,
  Badge,
  Alert,
  Spin,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  ApiOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';

interface DataSource {
  id: string;
  name: string;
  type: 'stock_api' | 'news_api' | 'financial_api' | 'social_api';
  provider: string;
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  rateLimit: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing' | 'error';
  lastTestTime?: string;
  responseTime?: number;
  errorMessage?: string;
  healthScore?: number;
}

interface ModelKey {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model: string;
  apiKey: string;
  isActive: boolean;
  usage: number;
  limit: number;
  createdAt: string;
  updatedAt: string;
}

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function DataSourcePage() {
  const { checkPermission, isAdmin } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [modelKeys, setModelKeys] = useState<ModelKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'datasource' | 'modelkey'>(
    'datasource'
  );
  const [editingItem, setEditingItem] = useState<DataSource | ModelKey | null>(
    null
  );
  const [testingConnections, setTestingConnections] = useState<Set<string>>(
    new Set()
  );
  const [connectionResults, setConnectionResults] = useState<Map<string, any>>(
    new Map()
  );
  const [batchTesting, setBatchTesting] = useState(false);
  const [healthMonitoring, setHealthMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [form] = Form.useForm();

  // 检查权限
  if (!isAdmin()) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h3>访问被拒绝</h3>
        <p>只有管理员可以访问数据源配置页面</p>
      </div>
    );
  }

  // 模拟数据
  useEffect(() => {
    setDataSources([
      {
        id: '1',
        name: 'Alpha Vantage API',
        type: 'stock_api',
        provider: 'Alpha Vantage',
        endpoint: 'https://www.alphavantage.co/query',
        apiKey: 'demo_key_***',
        isActive: true,
        rateLimit: 5,
        lastUsed: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        connectionStatus: 'connected',
        lastTestTime: '2024-01-15T10:30:00Z',
        responseTime: 245,
        healthScore: 95,
      },
      {
        id: '2',
        name: 'Yahoo Finance API',
        type: 'stock_api',
        provider: 'Yahoo',
        endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart',
        apiKey: '',
        isActive: true,
        rateLimit: 100,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        connectionStatus: 'connected',
        lastTestTime: '2024-01-15T09:15:00Z',
        responseTime: 180,
        healthScore: 88,
      },
      {
        id: '3',
        name: 'News API',
        type: 'news_api',
        provider: 'NewsAPI.org',
        endpoint: 'https://newsapi.org/v2/everything',
        apiKey: 'news_key_***',
        isActive: false,
        rateLimit: 1000,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        connectionStatus: 'error',
        lastTestTime: '2024-01-14T16:20:00Z',
        responseTime: 0,
        errorMessage: 'API Key无效或已过期',
        healthScore: 0,
      },
    ]);

    setModelKeys([
      {
        id: '1',
        name: 'OpenAI GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-***',
        isActive: true,
        usage: 15000,
        limit: 100000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'sk-ant-***',
        isActive: true,
        usage: 8500,
        limit: 50000,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-14T15:20:00Z',
      },
      {
        id: '3',
        name: 'Gemini Pro',
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'AIza***',
        isActive: false,
        usage: 0,
        limit: 30000,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ]);
  }, []);

  const getDataSourceTypeText = (type: string) => {
    const map = {
      stock_api: '股票数据',
      news_api: '新闻数据',
      financial_api: '财务数据',
      social_api: '社交数据',
    };
    return map[type as keyof typeof map] || type;
  };

  const getDataSourceTypeColor = (type: string) => {
    const map = {
      stock_api: 'blue',
      news_api: 'green',
      financial_api: 'orange',
      social_api: 'purple',
    };
    return map[type as keyof typeof map] || 'default';
  };

  const getProviderColor = (provider: string) => {
    const map = {
      openai: 'green',
      anthropic: 'blue',
      google: 'orange',
      azure: 'purple',
    };
    return map[provider as keyof typeof map] || 'default';
  };

  const maskApiKey = (key: string) => {
    if (!key) return '未设置';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  };

  // 测试连接函数
  const testConnection = async (dataSource: DataSource) => {
    const { id, endpoint, apiKey, type } = dataSource;

    // 添加到测试中的连接集合
    setTestingConnections(prev => new Set([...prev, id]));

    // 更新数据源状态为测试中
    setDataSources(prev =>
      prev.map(ds =>
        ds.id === id ? { ...ds, connectionStatus: 'testing' as const } : ds
      )
    );

    try {
      const startTime = Date.now();

      // 模拟API调用
      await new Promise(resolve =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      const responseTime = Date.now() - startTime;

      // 模拟连接结果（90%成功率）
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        const healthScore = Math.floor(85 + Math.random() * 15); // 85-100分
        const result = {
          status: 'success',
          responseTime,
          healthScore,
          message: '连接成功',
          timestamp: new Date().toISOString(),
        };

        // 更新连接结果
        setConnectionResults(prev => new Map(prev.set(id, result)));

        // 更新数据源状态
        setDataSources(prev =>
          prev.map(ds =>
            ds.id === id
              ? {
                  ...ds,
                  connectionStatus: 'connected' as const,
                  lastTestTime: result.timestamp,
                  responseTime,
                  healthScore,
                  errorMessage: undefined,
                }
              : ds
          )
        );

        message.success(`${dataSource.name} 连接测试成功`);
      } else {
        const errorMessages = [
          'API Key无效或已过期',
          '网络连接超时',
          '服务器返回错误状态码',
          '请求频率超过限制',
          '端点地址无法访问',
        ];
        const errorMessage =
          errorMessages[Math.floor(Math.random() * errorMessages.length)];

        const result = {
          status: 'error',
          responseTime: 0,
          healthScore: 0,
          message: errorMessage,
          timestamp: new Date().toISOString(),
        };

        // 更新连接结果
        setConnectionResults(prev => new Map(prev.set(id, result)));

        // 更新数据源状态
        setDataSources(prev =>
          prev.map(ds =>
            ds.id === id
              ? {
                  ...ds,
                  connectionStatus: 'error' as const,
                  lastTestTime: result.timestamp,
                  responseTime: 0,
                  errorMessage,
                  healthScore: 0,
                }
              : ds
          )
        );

        message.error(`${dataSource.name} 连接测试失败: ${errorMessage}`);
      }
    } catch (error) {
      const result = {
        status: 'error',
        responseTime: 0,
        healthScore: 0,
        message: '连接测试异常',
        timestamp: new Date().toISOString(),
      };

      setConnectionResults(prev => new Map(prev.set(id, result)));

      setDataSources(prev =>
        prev.map(ds =>
          ds.id === id
            ? {
                ...ds,
                connectionStatus: 'error' as const,
                lastTestTime: result.timestamp,
                responseTime: 0,
                errorMessage: '连接测试异常',
                healthScore: 0,
              }
            : ds
        )
      );

      message.error(`${dataSource.name} 连接测试异常`);
    } finally {
      // 从测试中的连接集合移除
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 批量测试连接
  const batchTestConnections = async () => {
    const activeSources = dataSources.filter(
      ds => ds.isActive && ds.endpoint && ds.apiKey
    );
    if (activeSources.length === 0) {
      message.warning('没有可测试的数据源');
      return;
    }

    setBatchTesting(true);
    message.info(`开始批量测试 ${activeSources.length} 个数据源...`);

    try {
      // 并发测试，但限制并发数量
      const batchSize = 3;
      for (let i = 0; i < activeSources.length; i += batchSize) {
        const batch = activeSources.slice(i, i + batchSize);
        await Promise.all(batch.map(ds => testConnection(ds)));
        // 批次间稍作延迟
        if (i + batchSize < activeSources.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      message.success('批量测试完成');
    } catch (error) {
      message.error('批量测试过程中出现错误');
    } finally {
      setBatchTesting(false);
    }
  };

  // 开始健康监控
  const startHealthMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    const interval = setInterval(async () => {
      const activeSources = dataSources.filter(
        ds => ds.isActive && ds.endpoint && ds.apiKey
      );
      if (activeSources.length > 0) {
        // 随机选择一个数据源进行健康检查
        const randomSource =
          activeSources[Math.floor(Math.random() * activeSources.length)];
        await testConnection(randomSource);
      }
    }, 30000); // 每30秒检查一次

    setMonitoringInterval(interval);
    setHealthMonitoring(true);
    message.success('健康监控已启动，每30秒自动检查一次');
  };

  // 停止健康监控
  const stopHealthMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setHealthMonitoring(false);
    message.info('健康监控已停止');
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // 获取连接状态显示
  const getConnectionStatusDisplay = (dataSource: DataSource) => {
    const {
      connectionStatus,
      responseTime,
      healthScore,
      errorMessage,
      lastTestTime,
    } = dataSource;
    const isTesting = testingConnections.has(dataSource.id);

    if (isTesting || connectionStatus === 'testing') {
      return (
        <Tooltip title='正在测试连接...'>
          <Badge status='processing' text='测试中' />
        </Tooltip>
      );
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <Tooltip
            title={`响应时间: ${responseTime}ms | 健康分数: ${healthScore}/100 | 最后测试: ${lastTestTime ? new Date(lastTestTime).toLocaleString('zh-CN') : '-'}`}
          >
            <Badge status='success' text='已连接' />
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip
            title={`错误信息: ${errorMessage} | 最后测试: ${lastTestTime ? new Date(lastTestTime).toLocaleString('zh-CN') : '-'}`}
          >
            <Badge status='error' text='连接失败' />
          </Tooltip>
        );
      case 'disconnected':
      default:
        return (
          <Tooltip title='未测试连接'>
            <Badge status='default' text='未知' />
          </Tooltip>
        );
    }
  };

  // 获取健康分数颜色
  const getHealthScoreColor = (score?: number) => {
    if (!score) return '#d9d9d9';
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const dataSourceColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getDataSourceTypeColor(type)}>
          {getDataSourceTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '连接状态',
      dataIndex: 'connectionStatus',
      key: 'connectionStatus',
      width: 120,
      render: (_: any, record: DataSource) =>
        getConnectionStatusDisplay(record),
    },
    {
      title: '健康分数',
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 120,
      render: (score: number) => {
        if (!score) return <span style={{ color: '#d9d9d9' }}>-</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              type='circle'
              size={40}
              percent={score}
              strokeColor={getHealthScoreColor(score)}
              format={() => score}
            />
            <span
              style={{ color: getHealthScoreColor(score), fontWeight: 'bold' }}
            >
              {score}/100
            </span>
          </div>
        );
      },
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 100,
      render: (time: number) => {
        if (!time) return <span style={{ color: '#d9d9d9' }}>-</span>;
        const color =
          time < 500 ? '#52c41a' : time < 1000 ? '#faad14' : '#f5222d';
        return <span style={{ color }}>{time}ms</span>;
      },
    },
    {
      title: '最后测试',
      dataIndex: 'lastTestTime',
      key: 'lastTestTime',
      width: 150,
      render: (time: string) => {
        if (!time) return <span style={{ color: '#d9d9d9' }}>未测试</span>;
        return (
          <Tooltip title={new Date(time).toLocaleString('zh-CN')}>
            <span>{new Date(time).toLocaleDateString('zh-CN')}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string) => (
        <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>
          {maskApiKey(key)}
        </code>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '速率限制',
      dataIndex: 'rateLimit',
      key: 'rateLimit',
      render: (limit: number) => `${limit}/分钟`,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date?: string) =>
        date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: DataSource) => {
        const isTesting = testingConnections.has(record.id);
        const connectionResult = connectionResults.get(record.id);

        return (
          <Space size='small'>
            <Tooltip title={isTesting ? '正在测试连接...' : '测试API连接'}>
              <Button
                type='primary'
                size='small'
                icon={isTesting ? <LoadingOutlined /> : <LinkOutlined />}
                loading={isTesting}
                onClick={() => testConnection(record)}
                disabled={!record.endpoint || !record.apiKey}
              >
                {isTesting ? '测试中' : '测试'}
              </Button>
            </Tooltip>
            <Button
              type='link'
              size='small'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record, 'datasource')}
            >
              编辑
            </Button>
            <Button
              type='link'
              size='small'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, 'datasource')}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  const modelKeyColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => (
        <Tag color={getProviderColor(provider)}>{provider.toUpperCase()}</Tag>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (key: string) => (
        <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>
          {maskApiKey(key)}
        </code>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '使用量',
      key: 'usage',
      render: (_, record: ModelKey) => {
        const percentage = (record.usage / record.limit) * 100;
        const color =
          percentage > 80 ? 'red' : percentage > 60 ? 'orange' : 'green';
        return (
          <div>
            <div>
              {record.usage.toLocaleString()} / {record.limit.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: ModelKey) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'modelkey')}
          >
            编辑
          </Button>
          <Button
            type='link'
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, 'modelkey')}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = (type: 'datasource' | 'modelkey') => {
    setModalType(type);
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (
    item: DataSource | ModelKey,
    type: 'datasource' | 'modelkey'
  ) => {
    setModalType(type);
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string, type: 'datasource' | 'modelkey') => {
    try {
      if (type === 'datasource') {
        setDataSources(dataSources.filter(item => item.id !== id));
        message.success('数据源删除成功');
      } else {
        setModelKeys(modelKeys.filter(item => item.id !== id));
        message.success('模型Key删除成功');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingItem) {
        // TODO: 调用更新API
        if (modalType === 'datasource') {
          setDataSources(
            dataSources.map(item =>
              item.id === editingItem.id
                ? { ...item, ...values, updatedAt: new Date().toISOString() }
                : item
            )
          );
        } else {
          setModelKeys(
            modelKeys.map(item =>
              item.id === editingItem.id
                ? { ...item, ...values, updatedAt: new Date().toISOString() }
                : item
            )
          );
        }
        message.success(
          `${modalType === 'datasource' ? '数据源' : '模型Key'}更新成功`
        );
      } else {
        // TODO: 调用创建API
        const newItem = {
          id: Date.now().toString(),
          ...values,
          ...(modalType === 'datasource'
            ? { lastUsed: undefined }
            : { usage: 0 }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (modalType === 'datasource') {
          setDataSources([...dataSources, newItem as DataSource]);
        } else {
          setModelKeys([...modelKeys, newItem as ModelKey]);
        }
        message.success(
          `${modalType === 'datasource' ? '数据源' : '模型Key'}创建成功`
        );
      }
      setModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>数据源配置</h1>
          <p className='text-gray-600 mt-1'>管理API数据源和模型密钥配置</p>
        </div>
        <div className='flex gap-3'>
          <Button
            icon={<LinkOutlined />}
            onClick={batchTestConnections}
            disabled={batchTesting || testingConnections.size > 0}
            loading={batchTesting || testingConnections.size > 0}
          >
            批量测试 (
            {
              dataSources.filter(ds => ds.isActive && ds.endpoint && ds.apiKey)
                .length
            }
            )
          </Button>
          <Button
            type={healthMonitoring ? 'default' : 'dashed'}
            icon={
              healthMonitoring ? (
                <CloseCircleOutlined />
              ) : (
                <CheckCircleOutlined />
              )
            }
            onClick={
              healthMonitoring ? stopHealthMonitoring : startHealthMonitoring
            }
            disabled={batchTesting || testingConnections.size > 0}
          >
            {healthMonitoring ? '停止监控' : '健康监控'}
          </Button>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => handleAdd('datasource')}
          >
            添加数据源
          </Button>
        </div>
      </div>

      {/* 连接状态统计 */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>总数据源</p>
              <p className='text-2xl font-bold text-gray-900'>
                {dataSources.length}
              </p>
            </div>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ApiOutlined className='text-blue-600 text-xl' />
            </div>
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>已连接</p>
              <p className='text-2xl font-bold text-green-600'>
                {
                  dataSources.filter(ds => ds.connectionStatus === 'connected')
                    .length
                }
              </p>
            </div>
            <div className='p-2 bg-green-100 rounded-lg'>
              <CheckCircleOutlined className='text-green-600 text-xl' />
            </div>
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>连接失败</p>
              <p className='text-2xl font-bold text-red-600'>
                {
                  dataSources.filter(ds => ds.connectionStatus === 'error')
                    .length
                }
              </p>
            </div>
            <div className='p-2 bg-red-100 rounded-lg'>
              <CloseCircleOutlined className='text-red-600 text-xl' />
            </div>
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>平均健康分数</p>
              <p className='text-2xl font-bold text-blue-600'>
                {(() => {
                  const connectedSources = dataSources.filter(
                    ds => ds.connectionStatus === 'connected' && ds.healthScore
                  );
                  if (connectedSources.length === 0) return '-';
                  const avgScore = Math.round(
                    connectedSources.reduce(
                      (sum, ds) => sum + (ds.healthScore || 0),
                      0
                    ) / connectedSources.length
                  );
                  return `${avgScore}/100`;
                })()}
              </p>
            </div>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ExclamationCircleOutlined className='text-blue-600 text-xl' />
            </div>
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>监控状态</p>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-3 h-3 rounded-full ${healthMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}
                ></div>
                <p className='text-sm font-medium'>
                  {healthMonitoring ? '监控中' : '已停止'}
                </p>
              </div>
              {healthMonitoring && (
                <p className='text-xs text-gray-500 mt-1'>每30秒检查一次</p>
              )}
            </div>
            <div
              className={`p-2 rounded-lg ${healthMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <LoadingOutlined
                className={`text-xl ${healthMonitoring ? 'text-green-600' : 'text-gray-400'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 连接测试结果提示 */}
      {Array.from(connectionResults.entries())
        .slice(-3)
        .map(([id, result]) => {
          const dataSource = dataSources.find(ds => ds.id === id);
          if (!dataSource) return null;

          return (
            <Alert
              key={id}
              type={result.status === 'success' ? 'success' : 'error'}
              message={`${dataSource.name} 连接测试${result.status === 'success' ? '成功' : '失败'}`}
              description={
                result.status === 'success'
                  ? `响应时间: ${result.responseTime}ms | 健康分数: ${result.healthScore}/100`
                  : `错误信息: ${result.message}`
              }
              showIcon
              closable
              className='mb-4'
              onClose={() => {
                setConnectionResults(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(id);
                  return newMap;
                });
              }}
            />
          );
        })}

      <Tabs defaultActiveKey='datasource'>
        <TabPane
          tab={
            <span>
              <ApiOutlined />
              数据源管理
            </span>
          }
          key='datasource'
        >
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleAdd('datasource')}
            >
              添加数据源
            </Button>
          </div>

          <Table
            columns={dataSourceColumns}
            dataSource={dataSources}
            rowKey='id'
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`,
            }}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <KeyOutlined />
              模型Key管理
            </span>
          }
          key='modelkey'
        >
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleAdd('modelkey')}
            >
              添加模型Key
            </Button>
          </div>

          <Table
            columns={modelKeyColumns}
            dataSource={modelKeys}
            rowKey='id'
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`,
            }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={
          editingItem
            ? `编辑${modalType === 'datasource' ? '数据源' : '模型Key'}`
            : `添加${modalType === 'datasource' ? '数据源' : '模型Key'}`
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <Form.Item
            name='name'
            label='名称'
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder='请输入名称' />
          </Form.Item>

          {modalType === 'datasource' ? (
            <>
              <Form.Item
                name='type'
                label='数据源类型'
                rules={[{ required: true, message: '请选择数据源类型' }]}
              >
                <Select placeholder='请选择数据源类型'>
                  <Option value='stock_api'>股票数据</Option>
                  <Option value='news_api'>新闻数据</Option>
                  <Option value='financial_api'>财务数据</Option>
                  <Option value='social_api'>社交数据</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='provider'
                label='提供商'
                rules={[{ required: true, message: '请输入提供商' }]}
              >
                <Input placeholder='请输入提供商' />
              </Form.Item>

              <Form.Item
                name='endpoint'
                label='API端点'
                rules={[{ required: true, message: '请输入API端点' }]}
              >
                <Input placeholder='请输入API端点' />
              </Form.Item>

              <Form.Item
                name='rateLimit'
                label='速率限制（每分钟）'
                rules={[{ required: true, message: '请输入速率限制' }]}
              >
                <Input type='number' placeholder='请输入速率限制' />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name='provider'
                label='提供商'
                rules={[{ required: true, message: '请选择提供商' }]}
              >
                <Select placeholder='请选择提供商'>
                  <Option value='openai'>OpenAI</Option>
                  <Option value='anthropic'>Anthropic</Option>
                  <Option value='google'>Google</Option>
                  <Option value='azure'>Azure</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='model'
                label='模型'
                rules={[{ required: true, message: '请输入模型' }]}
              >
                <Input placeholder='请输入模型' />
              </Form.Item>

              <Form.Item
                name='limit'
                label='使用限制'
                rules={[{ required: true, message: '请输入使用限制' }]}
              >
                <Input type='number' placeholder='请输入使用限制' />
              </Form.Item>
            </>
          )}

          <Form.Item
            name='apiKey'
            label='API Key'
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password placeholder='请输入API Key' />
          </Form.Item>

          <Form.Item name='isActive' label='状态' valuePropName='checked'>
            <Switch checkedChildren='启用' unCheckedChildren='禁用' />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit' loading={loading}>
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
