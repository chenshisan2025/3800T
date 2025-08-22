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
  Drawer,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { Permission } from '@/types/rbac';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Disclaimer } from '@/components/compliance/Disclaimer';
import { DataSourceHint } from '@/components/compliance/DataSourceHint';

interface AiReport {
  id: string;
  title: string;
  stockSymbol: string;
  stockName: string;
  reportType: 'technical' | 'fundamental' | 'sentiment' | 'forecast';
  status: 'generating' | 'completed' | 'failed';
  summary: string;
  content: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  userName?: string;
}

const { Option } = Select;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

export default function ReportsPage() {
  const { checkPermission } = useAuth();
  const [reports, setReports] = useState<AiReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AiReport | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  useEffect(() => {
    setReports([
      {
        id: '1',
        title: 'AAPL技术分析报告',
        stockSymbol: 'AAPL',
        stockName: '苹果公司',
        reportType: 'technical',
        status: 'completed',
        summary:
          '基于技术指标分析，AAPL股价呈现上升趋势，建议关注支撑位和阻力位。',
        content:
          '# AAPL技术分析报告\n\n## 概述\n苹果公司(AAPL)股价在过去30天内表现强劲，技术指标显示积极信号。\n\n## 技术指标分析\n- **移动平均线**: 20日均线上穿50日均线，形成金叉\n- **RSI指标**: 当前RSI为65，处于强势区间\n- **MACD**: MACD线上穿信号线，显示买入信号\n\n## 支撑位和阻力位\n- 支撑位: $180, $175\n- 阻力位: $200, $210\n\n## 建议\n建议在回调至支撑位时买入，目标价位$200。',
        confidence: 85,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
        userId: '1',
        userName: '系统',
      },
      {
        id: '2',
        title: 'TSLA基本面分析',
        stockSymbol: 'TSLA',
        stockName: '特斯拉',
        reportType: 'fundamental',
        status: 'completed',
        summary: '特斯拉Q4财报超预期，电动车销量增长强劲，但估值偏高需谨慎。',
        content:
          '# TSLA基本面分析报告\n\n## 财务概况\n特斯拉Q4财报显示营收和利润均超市场预期。\n\n## 关键指标\n- 营收增长: 同比增长37%\n- 净利润率: 8.2%\n- 交付量: 同比增长35%\n\n## 风险因素\n- 估值偏高，P/E比率达到65倍\n- 竞争加剧，传统车企加速电动化\n- 供应链风险\n\n## 投资建议\n长期看好，但短期估值偏高，建议等待回调机会。',
        confidence: 78,
        createdAt: '2024-01-14T15:20:00Z',
        updatedAt: '2024-01-14T15:25:00Z',
        userId: '2',
        userName: 'AI分析师',
      },
      {
        id: '3',
        title: 'GOOGL情绪分析报告',
        stockSymbol: 'GOOGL',
        stockName: '谷歌',
        reportType: 'sentiment',
        status: 'generating',
        summary: '正在分析社交媒体和新闻情绪...',
        content: '',
        confidence: 0,
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-16T09:00:00Z',
      },
    ]);
  }, []);

  const getReportTypeText = (type: string) => {
    const map = {
      technical: '技术分析',
      fundamental: '基本面分析',
      sentiment: '情绪分析',
      forecast: '预测分析',
    };
    return map[type as keyof typeof map] || type;
  };

  const getReportTypeColor = (type: string) => {
    const map = {
      technical: 'blue',
      fundamental: 'green',
      sentiment: 'orange',
      forecast: 'purple',
    };
    return map[type as keyof typeof map] || 'default';
  };

  const getStatusText = (status: string) => {
    const map = {
      generating: '生成中',
      completed: '已完成',
      failed: '失败',
    };
    return map[status as keyof typeof map] || status;
  };

  const getStatusColor = (status: string) => {
    const map = {
      generating: 'processing',
      completed: 'success',
      failed: 'error',
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '股票',
      key: 'stock',
      render: (_, record: AiReport) => (
        <div>
          <Tag color='blue'>{record.stockSymbol}</Tag>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.stockName}
          </div>
        </div>
      ),
    },
    {
      title: '报告类型',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (type: string) => (
        <Tag color={getReportTypeColor(type)}>{getReportTypeText(type)}</Tag>
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
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => {
        if (confidence === 0) return '-';
        const color =
          confidence >= 80 ? 'green' : confidence >= 60 ? 'orange' : 'red';
        return <Tag color={color}>{confidence}%</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '创建者',
      dataIndex: 'userName',
      key: 'userName',
      render: (name?: string) => name || '系统',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: AiReport) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type='link'
            icon={<FileTextOutlined />}
            onClick={() => handleViewContent(record)}
            disabled={record.status !== 'completed'}
          >
            详情
          </Button>
          <PermissionGuard permission={Permission.REPORT_WRITE}>
            <Button
              type='link'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (report: AiReport) => {
    setSelectedReport(report);
    form.setFieldsValue(report);
    setModalVisible(true);
  };

  const handleViewContent = (report: AiReport) => {
    setSelectedReport(report);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: 调用删除API
      setReports(reports.filter(report => report.id !== id));
      message.success('报告删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 调用生成报告API
      const newReport: AiReport = {
        id: Date.now().toString(),
        ...values,
        status: 'generating',
        summary: '正在生成报告...',
        content: '',
        confidence: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: '1',
        userName: '管理员',
      };
      setReports([newReport, ...reports]);
      message.success('报告生成任务已提交');
      setModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = selectedReport && modalVisible;

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <h2>AI报告管理</h2>
        <PermissionGuard permission={Permission.REPORT_WRITE}>
          <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
            生成报告
          </Button>
        </PermissionGuard>
      </div>

      <Table
        columns={columns}
        dataSource={reports}
        rowKey='id'
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={isViewMode ? '查看报告' : '生成新报告'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedReport(null);
        }}
        footer={
          isViewMode
            ? [
                <Button
                  key='close'
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedReport(null);
                  }}
                >
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
            name='title'
            label='报告标题'
            rules={[{ required: true, message: '请输入报告标题' }]}
          >
            <Input placeholder='请输入报告标题' />
          </Form.Item>

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

          <Form.Item
            name='reportType'
            label='报告类型'
            rules={[{ required: true, message: '请选择报告类型' }]}
          >
            <Select placeholder='请选择报告类型'>
              <Option value='technical'>技术分析</Option>
              <Option value='fundamental'>基本面分析</Option>
              <Option value='sentiment'>情绪分析</Option>
              <Option value='forecast'>预测分析</Option>
            </Select>
          </Form.Item>

          {isViewMode && (
            <>
              <Form.Item name='summary' label='摘要'>
                <TextArea rows={3} disabled />
              </Form.Item>

              <Form.Item name='confidence' label='置信度'>
                <Input disabled addonAfter='%' />
              </Form.Item>
            </>
          )}

          {!isViewMode && (
            <Form.Item>
              <Space>
                <Button type='primary' htmlType='submit' loading={loading}>
                  生成报告
                </Button>
                <Button onClick={() => setModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title={selectedReport?.title}
        placement='right'
        size='large'
        onClose={() => {
          setDrawerVisible(false);
          setSelectedReport(null);
        }}
        open={drawerVisible}
      >
        {selectedReport && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color='blue'>{selectedReport.stockSymbol}</Tag>
                <Tag color={getReportTypeColor(selectedReport.reportType)}>
                  {getReportTypeText(selectedReport.reportType)}
                </Tag>
                <Tag
                  color={
                    selectedReport.confidence >= 80
                      ? 'green'
                      : selectedReport.confidence >= 60
                        ? 'orange'
                        : 'red'
                  }
                >
                  置信度: {selectedReport.confidence}%
                </Tag>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type='secondary'>
                创建时间:{' '}
                {new Date(selectedReport.createdAt).toLocaleString('zh-CN')}
              </Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Title level={4}>摘要</Title>
              <Paragraph>{selectedReport.summary}</Paragraph>
            </div>

            <div>
              <Title level={4}>详细内容</Title>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              >
                {selectedReport.content || '暂无内容'}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 合规组件 */}
      <div style={{ marginTop: '24px', padding: '16px 0' }}>
        <Disclaimer
          type='ai-analysis'
          position='bottom'
          theme='light'
          showIcon={true}
          isClosable={true}
        />
        <div style={{ marginTop: '8px' }}>
          <DataSourceHint
            position='bottom'
            theme='light'
            showIcon={true}
            isClosable={true}
          />
        </div>
      </div>
    </div>
  );
}
