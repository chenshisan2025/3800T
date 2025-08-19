'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Tabs, Switch, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, ApiOutlined } from '@ant-design/icons';
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
  const [modalType, setModalType] = useState<'datasource' | 'modelkey'>('datasource');
  const [editingItem, setEditingItem] = useState<DataSource | ModelKey | null>(null);
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
        updatedAt: '2024-01-15T10:30:00Z'
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
        updatedAt: '2024-01-02T00:00:00Z'
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
        updatedAt: '2024-01-03T00:00:00Z'
      }
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
        updatedAt: '2024-01-15T10:30:00Z'
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
        updatedAt: '2024-01-14T15:20:00Z'
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
        updatedAt: '2024-01-03T00:00:00Z'
      }
    ]);
  }, []);

  const getDataSourceTypeText = (type: string) => {
    const map = {
      stock_api: '股票数据',
      news_api: '新闻数据',
      financial_api: '财务数据',
      social_api: '社交数据'
    };
    return map[type as keyof typeof map] || type;
  };

  const getDataSourceTypeColor = (type: string) => {
    const map = {
      stock_api: 'blue',
      news_api: 'green',
      financial_api: 'orange',
      social_api: 'purple'
    };
    return map[type as keyof typeof map] || 'default';
  };

  const getProviderColor = (provider: string) => {
    const map = {
      openai: 'green',
      anthropic: 'blue',
      google: 'orange',
      azure: 'purple'
    };
    return map[provider as keyof typeof map] || 'default';
  };

  const maskApiKey = (key: string) => {
    if (!key) return '未设置';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
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
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getDataSourceTypeColor(type)}>
          {getDataSourceTypeText(type)}
        </Tag>
      ),
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
      render: (date?: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: DataSource) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'datasource')}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, 'datasource')}
          >
            删除
          </Button>
        </Space>
      ),
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
        <Tag color={getProviderColor(provider)}>
          {provider.toUpperCase()}
        </Tag>
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
        const color = percentage > 80 ? 'red' : percentage > 60 ? 'orange' : 'green';
        return (
          <div>
            <div>{record.usage.toLocaleString()} / {record.limit.toLocaleString()}</div>
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
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, 'modelkey')}
          >
            编辑
          </Button>
          <Button
            type="link"
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

  const handleEdit = (item: DataSource | ModelKey, type: 'datasource' | 'modelkey') => {
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
          setDataSources(dataSources.map(item => 
            item.id === editingItem.id ? { ...item, ...values, updatedAt: new Date().toISOString() } : item
          ));
        } else {
          setModelKeys(modelKeys.map(item => 
            item.id === editingItem.id ? { ...item, ...values, updatedAt: new Date().toISOString() } : item
          ));
        }
        message.success(`${modalType === 'datasource' ? '数据源' : '模型Key'}更新成功`);
      } else {
        // TODO: 调用创建API
        const newItem = {
          id: Date.now().toString(),
          ...values,
          ...(modalType === 'datasource' ? { lastUsed: undefined } : { usage: 0 }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (modalType === 'datasource') {
          setDataSources([...dataSources, newItem as DataSource]);
        } else {
          setModelKeys([...modelKeys, newItem as ModelKey]);
        }
        message.success(`${modalType === 'datasource' ? '数据源' : '模型Key'}创建成功`);
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
      <h2>数据源配置</h2>
      
      <Tabs defaultActiveKey="datasource">
        <TabPane tab={<span><ApiOutlined />数据源管理</span>} key="datasource">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('datasource')}>
              添加数据源
            </Button>
          </div>
          
          <Table
            columns={dataSourceColumns}
            dataSource={dataSources}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </TabPane>
        
        <TabPane tab={<span><KeyOutlined />模型Key管理</span>} key="modelkey">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('modelkey')}>
              添加模型Key
            </Button>
          </div>
          
          <Table
            columns={modelKeyColumns}
            dataSource={modelKeys}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={editingItem ? `编辑${modalType === 'datasource' ? '数据源' : '模型Key'}` : 
               `添加${modalType === 'datasource' ? '数据源' : '模型Key'}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>

          {modalType === 'datasource' ? (
            <>
              <Form.Item
                name="type"
                label="数据源类型"
                rules={[{ required: true, message: '请选择数据源类型' }]}
              >
                <Select placeholder="请选择数据源类型">
                  <Option value="stock_api">股票数据</Option>
                  <Option value="news_api">新闻数据</Option>
                  <Option value="financial_api">财务数据</Option>
                  <Option value="social_api">社交数据</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="provider"
                label="提供商"
                rules={[{ required: true, message: '请输入提供商' }]}
              >
                <Input placeholder="请输入提供商" />
              </Form.Item>

              <Form.Item
                name="endpoint"
                label="API端点"
                rules={[{ required: true, message: '请输入API端点' }]}
              >
                <Input placeholder="请输入API端点" />
              </Form.Item>

              <Form.Item
                name="rateLimit"
                label="速率限制（每分钟）"
                rules={[{ required: true, message: '请输入速率限制' }]}
              >
                <Input type="number" placeholder="请输入速率限制" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="provider"
                label="提供商"
                rules={[{ required: true, message: '请选择提供商' }]}
              >
                <Select placeholder="请选择提供商">
                  <Option value="openai">OpenAI</Option>
                  <Option value="anthropic">Anthropic</Option>
                  <Option value="google">Google</Option>
                  <Option value="azure">Azure</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="model"
                label="模型"
                rules={[{ required: true, message: '请输入模型' }]}
              >
                <Input placeholder="请输入模型" />
              </Form.Item>

              <Form.Item
                name="limit"
                label="使用限制"
                rules={[{ required: true, message: '请输入使用限制' }]}
              >
                <Input type="number" placeholder="请输入使用限制" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password placeholder="请输入API Key" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}