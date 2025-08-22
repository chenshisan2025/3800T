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
  DatePicker,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';
import dayjs from 'dayjs';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planType: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  price: number;
  autoRenew: boolean;
  createdAt: string;
}

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function SubscriptionsPage() {
  const { checkPermission } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setSubscriptions([
      {
        id: '1',
        userId: '1',
        userName: '张三',
        userEmail: 'zhangsan@example.com',
        planType: 'premium',
        status: 'active',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        price: 299,
        autoRenew: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: '2',
        userName: '李四',
        userEmail: 'lisi@example.com',
        planType: 'basic',
        status: 'active',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-02-15T23:59:59Z',
        price: 99,
        autoRenew: false,
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        id: '3',
        userId: '3',
        userName: '王五',
        userEmail: 'wangwu@example.com',
        planType: 'enterprise',
        status: 'expired',
        startDate: '2023-12-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        price: 999,
        autoRenew: false,
        createdAt: '2023-12-01T00:00:00Z',
      },
    ]);
  }, []);

  const getPlanTypeText = (type: string) => {
    const map = {
      basic: '基础版',
      premium: '高级版',
      enterprise: '企业版',
    };
    return map[type as keyof typeof map] || type;
  };

  const getPlanTypeColor = (type: string) => {
    const map = {
      basic: 'blue',
      premium: 'gold',
      enterprise: 'purple',
    };
    return map[type as keyof typeof map] || 'default';
  };

  const getStatusText = (status: string) => {
    const map = {
      active: '有效',
      expired: '已过期',
      cancelled: '已取消',
    };
    return map[status as keyof typeof map] || status;
  };

  const getStatusColor = (status: string) => {
    const map = {
      active: 'green',
      expired: 'red',
      cancelled: 'gray',
    };
    return map[status as keyof typeof map] || 'default';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record: Subscription) => (
        <div>
          <div>{record.userName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.userEmail}
          </div>
        </div>
      ),
    },
    {
      title: '套餐类型',
      dataIndex: 'planType',
      key: 'planType',
      render: (type: string) => (
        <Tag color={getPlanTypeColor(type)}>{getPlanTypeText(type)}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '自动续费',
      dataIndex: 'autoRenew',
      key: 'autoRenew',
      render: (autoRenew: boolean) => (
        <Tag color={autoRenew ? 'green' : 'gray'}>
          {autoRenew ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Subscription) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <PermissionGuard permission={Permission.SUBSCRIPTION_WRITE}>
            <Button
              type='link'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingSubscription(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    form.setFieldsValue({
      ...subscription,
      dateRange: [dayjs(subscription.startDate), dayjs(subscription.endDate)],
    });
    setModalVisible(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    form.setFieldsValue({
      ...subscription,
      dateRange: [dayjs(subscription.startDate), dayjs(subscription.endDate)],
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const [startDate, endDate] = values.dateRange;
      const subscriptionData = {
        ...values,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      delete subscriptionData.dateRange;

      if (editingSubscription) {
        // TODO: 调用更新API
        setSubscriptions(
          subscriptions.map(sub =>
            sub.id === editingSubscription.id
              ? { ...sub, ...subscriptionData }
              : sub
          )
        );
        message.success('订阅更新成功');
      } else {
        // TODO: 调用创建API
        const newSubscription: Subscription = {
          id: Date.now().toString(),
          userId: '1', // TODO: 从用户选择器获取
          userName: '新用户', // TODO: 从用户选择器获取
          userEmail: 'newuser@example.com', // TODO: 从用户选择器获取
          ...subscriptionData,
          createdAt: new Date().toISOString(),
        };
        setSubscriptions([...subscriptions, newSubscription]);
        message.success('订阅创建成功');
      }
      setModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const isViewMode =
    modalVisible && !checkPermission(Permission.SUBSCRIPTION_WRITE);

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <h2>订阅管理</h2>
        <PermissionGuard permission={Permission.SUBSCRIPTION_WRITE}>
          <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
            添加订阅
          </Button>
        </PermissionGuard>
      </div>

      <Table
        columns={columns}
        dataSource={subscriptions}
        rowKey='id'
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={
          isViewMode
            ? '查看订阅'
            : editingSubscription
              ? '编辑订阅'
              : '添加订阅'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          isViewMode
            ? [
                <Button key='close' onClick={() => setModalVisible(false)}>
                  关闭
                </Button>,
              ]
            : null
        }
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          disabled={isViewMode}
        >
          <Form.Item
            name='planType'
            label='套餐类型'
            rules={[{ required: true, message: '请选择套餐类型' }]}
          >
            <Select placeholder='请选择套餐类型'>
              <Option value='basic'>基础版</Option>
              <Option value='premium'>高级版</Option>
              <Option value='enterprise'>企业版</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='status'
            label='状态'
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder='请选择状态'>
              <Option value='active'>有效</Option>
              <Option value='expired'>已过期</Option>
              <Option value='cancelled'>已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='dateRange'
            label='有效期'
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item
            name='price'
            label='价格'
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder='请输入价格'
              min={0}
              precision={2}
              addonBefore='¥'
            />
          </Form.Item>

          <Form.Item
            name='autoRenew'
            label='自动续费'
            rules={[{ required: true, message: '请选择是否自动续费' }]}
          >
            <Select placeholder='请选择是否自动续费'>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          {!isViewMode && (
            <Form.Item>
              <Space>
                <Button type='primary' htmlType='submit' loading={loading}>
                  {editingSubscription ? '更新' : '创建'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
