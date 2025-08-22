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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';

interface WatchlistItem {
  id: string;
  userId: string;
  userName: string;
  stockSymbol: string;
  stockName: string;
  addedAt: string;
}

interface Alert {
  id: string;
  userId: string;
  userName: string;
  stockSymbol: string;
  stockName: string;
  alertType:
    | 'price_above'
    | 'price_below'
    | 'volume_above'
    | 'change_above'
    | 'change_below';
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

const { Option } = Select;
const { TabPane } = Tabs;

export default function WatchlistPage() {
  const { checkPermission } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'watchlist' | 'alert'>(
    'watchlist'
  );
  const [editingItem, setEditingItem] = useState<WatchlistItem | Alert | null>(
    null
  );
  const [form] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setWatchlist([
      {
        id: '1',
        userId: '1',
        userName: '张三',
        stockSymbol: 'AAPL',
        stockName: '苹果公司',
        addedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: '1',
        userName: '张三',
        stockSymbol: 'TSLA',
        stockName: '特斯拉',
        addedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        userId: '2',
        userName: '李四',
        stockSymbol: 'GOOGL',
        stockName: '谷歌',
        addedAt: '2024-01-03T00:00:00Z',
      },
    ]);

    setAlerts([
      {
        id: '1',
        userId: '1',
        userName: '张三',
        stockSymbol: 'AAPL',
        stockName: '苹果公司',
        alertType: 'price_above',
        targetValue: 200,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: '2',
        userName: '李四',
        stockSymbol: 'TSLA',
        stockName: '特斯拉',
        alertType: 'price_below',
        targetValue: 150,
        isActive: false,
        createdAt: '2024-01-02T00:00:00Z',
        triggeredAt: '2024-01-10T10:30:00Z',
      },
    ]);
  }, []);

  const getAlertTypeText = (type: string) => {
    const map = {
      price_above: '价格高于',
      price_below: '价格低于',
      volume_above: '成交量高于',
      change_above: '涨幅高于',
      change_below: '跌幅高于',
    };
    return map[type as keyof typeof map] || type;
  };

  const watchlistColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '股票代码',
      dataIndex: 'stockSymbol',
      key: 'stockSymbol',
      render: (symbol: string) => <Tag color='blue'>{symbol}</Tag>,
    },
    {
      title: '股票名称',
      dataIndex: 'stockName',
      key: 'stockName',
    },
    {
      title: '添加时间',
      dataIndex: 'addedAt',
      key: 'addedAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: WatchlistItem) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record, 'watchlist')}
          >
            查看
          </Button>
          <PermissionGuard permission={Permission.WATCHLIST_WRITE}>
            <Button
              type='link'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record, 'watchlist')}
            >
              编辑
            </Button>
            <Button
              type='link'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, 'watchlist')}
            >
              删除
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const alertColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '股票',
      key: 'stock',
      render: (_, record: Alert) => (
        <div>
          <Tag color='blue'>{record.stockSymbol}</Tag>
          <span>{record.stockName}</span>
        </div>
      ),
    },
    {
      title: '提醒类型',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (type: string) => getAlertTypeText(type),
    },
    {
      title: '目标值',
      dataIndex: 'targetValue',
      key: 'targetValue',
      render: (value: number, record: Alert) => {
        if (record.alertType.includes('price')) {
          return `$${value}`;
        } else if (record.alertType.includes('change')) {
          return `${value}%`;
        }
        return value;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Alert) => {
        if (record.triggeredAt) {
          return <Tag color='orange'>已触发</Tag>;
        }
        return (
          <Tag color={isActive ? 'green' : 'gray'}>
            {isActive ? '活跃' : '暂停'}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (date?: string) =>
        date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Alert) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record, 'alert')}
          >
            查看
          </Button>
          <PermissionGuard permission={Permission.WATCHLIST_WRITE}>
            <Button
              type='link'
              icon={<EditOutlined />}
              onClick={() => handleEdit(record, 'alert')}
            >
              编辑
            </Button>
            <Button
              type='link'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, 'alert')}
            >
              删除
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const handleAdd = (type: 'watchlist' | 'alert') => {
    setModalType(type);
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (
    item: WatchlistItem | Alert,
    type: 'watchlist' | 'alert'
  ) => {
    setModalType(type);
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleEdit = (
    item: WatchlistItem | Alert,
    type: 'watchlist' | 'alert'
  ) => {
    setModalType(type);
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string, type: 'watchlist' | 'alert') => {
    try {
      if (type === 'watchlist') {
        setWatchlist(watchlist.filter(item => item.id !== id));
        message.success('自选股删除成功');
      } else {
        setAlerts(alerts.filter(item => item.id !== id));
        message.success('提醒删除成功');
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
        if (modalType === 'watchlist') {
          setWatchlist(
            watchlist.map(item =>
              item.id === editingItem.id ? { ...item, ...values } : item
            )
          );
        } else {
          setAlerts(
            alerts.map(item =>
              item.id === editingItem.id ? { ...item, ...values } : item
            )
          );
        }
        message.success(
          `${modalType === 'watchlist' ? '自选股' : '提醒'}更新成功`
        );
      } else {
        // TODO: 调用创建API
        const newItem = {
          id: Date.now().toString(),
          userId: '1', // TODO: 从用户选择器获取
          userName: '新用户', // TODO: 从用户选择器获取
          ...values,
          ...(modalType === 'watchlist'
            ? { addedAt: new Date().toISOString() }
            : { createdAt: new Date().toISOString() }),
        };

        if (modalType === 'watchlist') {
          setWatchlist([...watchlist, newItem as WatchlistItem]);
        } else {
          setAlerts([...alerts, newItem as Alert]);
        }
        message.success(
          `${modalType === 'watchlist' ? '自选股' : '提醒'}创建成功`
        );
      }
      setModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const isViewMode =
    modalVisible && !checkPermission(Permission.WATCHLIST_WRITE);

  return (
    <div>
      <h2>Watchlist & Alert 管理</h2>

      <Tabs defaultActiveKey='watchlist'>
        <TabPane tab='自选股管理' key='watchlist'>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <PermissionGuard permission={Permission.WATCHLIST_WRITE}>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => handleAdd('watchlist')}
              >
                添加自选股
              </Button>
            </PermissionGuard>
          </div>

          <Table
            columns={watchlistColumns}
            dataSource={watchlist}
            rowKey='id'
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`,
            }}
          />
        </TabPane>

        <TabPane tab='提醒管理' key='alerts'>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <PermissionGuard permission={Permission.WATCHLIST_WRITE}>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => handleAdd('alert')}
              >
                添加提醒
              </Button>
            </PermissionGuard>
          </div>

          <Table
            columns={alertColumns}
            dataSource={alerts}
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
          isViewMode
            ? `查看${modalType === 'watchlist' ? '自选股' : '提醒'}`
            : editingItem
              ? `编辑${modalType === 'watchlist' ? '自选股' : '提醒'}`
              : `添加${modalType === 'watchlist' ? '自选股' : '提醒'}`
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
            name='stockSymbol'
            label='股票代码'
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder='请输入股票代码' />
          </Form.Item>

          <Form.Item
            name='stockName'
            label='股票名称'
            rules={[{ required: true, message: '请输入股票名称' }]}
          >
            <Input placeholder='请输入股票名称' />
          </Form.Item>

          {modalType === 'alert' && (
            <>
              <Form.Item
                name='alertType'
                label='提醒类型'
                rules={[{ required: true, message: '请选择提醒类型' }]}
              >
                <Select placeholder='请选择提醒类型'>
                  <Option value='price_above'>价格高于</Option>
                  <Option value='price_below'>价格低于</Option>
                  <Option value='volume_above'>成交量高于</Option>
                  <Option value='change_above'>涨幅高于</Option>
                  <Option value='change_below'>跌幅高于</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name='targetValue'
                label='目标值'
                rules={[{ required: true, message: '请输入目标值' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder='请输入目标值'
                  min={0}
                  precision={2}
                />
              </Form.Item>

              <Form.Item
                name='isActive'
                label='状态'
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder='请选择状态'>
                  <Option value={true}>活跃</Option>
                  <Option value={false}>暂停</Option>
                </Select>
              </Form.Item>
            </>
          )}

          {!isViewMode && (
            <Form.Item>
              <Space>
                <Button type='primary' htmlType='submit' loading={loading}>
                  {editingItem ? '更新' : '创建'}
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
