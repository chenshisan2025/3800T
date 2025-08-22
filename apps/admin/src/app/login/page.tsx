'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Space,
  message,
} from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

// 登录请求接口
interface LoginRequest {
  email: string;
  password: string;
}

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // 如果已经登录，重定向到仪表板
  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (values: LoginRequest) => {
    try {
      setLoading(true);
      await login(values);
    } catch (error) {
      // 错误已在 AuthProvider 中处理
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await login({
        email: 'admin@gulingtong.com',
        password: 'admin123',
      });
    } catch (error) {
      message.error('演示登录失败，请检查 API 服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo 和标题 */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4'>
            <span className='text-2xl font-bold text-white'>古</span>
          </div>
          <Title level={2} className='!mb-2 !text-gray-800'>
            古灵通管理后台
          </Title>
          <Text type='secondary' className='text-base'>
            股票分析平台管理系统
          </Text>
        </div>

        {/* 登录表单 */}
        <Card className='shadow-lg border-0'>
          <Form
            form={form}
            name='login'
            onFinish={handleSubmit}
            layout='vertical'
            size='large'
            autoComplete='off'
          >
            <Form.Item
              name='email'
              label='邮箱地址'
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined className='text-gray-400' />}
                placeholder='请输入邮箱地址'
                autoComplete='email'
              />
            </Form.Item>

            <Form.Item
              name='password'
              label='密码'
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className='text-gray-400' />}
                placeholder='请输入密码'
                autoComplete='current-password'
              />
            </Form.Item>

            <Form.Item className='mb-4'>
              <div className='flex justify-between items-center'>
                <Link
                  href='/forgot-password'
                  className='text-primary hover:text-primary-hover text-sm'
                >
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            <Form.Item className='mb-4'>
              <Button
                type='primary'
                htmlType='submit'
                loading={loading}
                block
                size='large'
                className='h-12 text-base font-medium'
              >
                登录
              </Button>
            </Form.Item>

            <Divider className='!my-6'>
              <Text type='secondary' className='text-sm'>
                或者
              </Text>
            </Divider>

            <Space direction='vertical' className='w-full' size='middle'>
              <Button
                block
                size='large'
                loading={loading}
                onClick={handleDemoLogin}
                className='h-12 text-base'
              >
                演示登录
              </Button>

              <div className='text-center'>
                <Text type='secondary' className='text-sm'>
                  仅限内部账号登录
                </Text>
              </div>
            </Space>
          </Form>
        </Card>

        {/* 底部信息 */}
        <div className='text-center mt-8'>
          <Text type='secondary' className='text-xs'>
            © 2024 古灵通. 保留所有权利.
          </Text>
        </div>
      </div>
    </div>
  );
}
