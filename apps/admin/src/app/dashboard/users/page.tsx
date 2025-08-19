'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole, Permission } from '@/types/rbac';
import { RoleTag } from '@/components/RoleTag';
import { PermissionGuard } from '@/components/PermissionGuard';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

const { Option } = Select;

export default function UsersPage() {
  const { checkPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setUsers([
      {
        id: '1',
        email: 'admin@example.com',
        name: '系统管理员',
        role: UserRole.ADMIN,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        email: 'analyst@example.com',
        name: '数据分析师',
        role: UserRole.ANALYST,
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
        lastLoginAt: '2024-01-14T15:20:00Z'
      },
      {
        id: '3',
        email: 'support@example.com',
        name: '客服专员',
        role: UserRole.SUPPORT,
        status: 'active',
        createdAt: '2024-01-03T00:00:00Z'
      }
    ]);
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => <RoleTag role={role} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date?: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: User) => (
        <Space>
          <PermissionGuard permission={Permission.USER_WRITE}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={Permission.USER_WRITE}>
            <Popconfirm
              title="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: 调用删除API
      setUsers(users.filter(user => user.id !== id));
      message.success('用户删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingUser) {
        // TODO: 调用更新API
        setUsers(users.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        ));
        message.success('用户更新成功');
      } else {
        // TODO: 调用创建API
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        message.success('用户创建成功');
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>用户管理</h2>
        <PermissionGuard permission={Permission.USER_WRITE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加用户
          </Button>
        </PermissionGuard>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value={UserRole.ADMIN}>管理员</Option>
              <Option value={UserRole.ANALYST}>分析师</Option>
              <Option value={UserRole.SUPPORT}>客服</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? '更新' : '创建'}
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