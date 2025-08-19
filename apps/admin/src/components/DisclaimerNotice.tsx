'use client';

import React from 'react';
import { Alert, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DisclaimerNoticeProps {
  type?: 'investment' | 'data' | 'ai' | 'full';
  showIcon?: boolean;
  closable?: boolean;
  className?: string;
}

export default function DisclaimerNotice({
  type = 'full',
  showIcon = true,
  closable = false,
  className = '',
}: DisclaimerNoticeProps) {
  const getNoticeContent = () => {
    switch (type) {
      case 'investment':
        return {
          message: '投资风险提示',
          description: '本平台提供的信息仅供参考，不构成投资建议。投资有风险，决策需谨慎。',
        };
      case 'data':
        return {
          message: '数据声明',
          description: '数据可能存在延迟，请以官方数据为准。',
        };
      case 'ai':
        return {
          message: 'AI分析声明',
          description: 'AI分析结果仅供参考，不保证准确性，请结合多方信息独立判断。',
        };
      case 'full':
      default:
        return {
          message: '重要声明',
          description: (
            <div>
              <Text>• 本平台提供的信息仅供参考，不构成投资建议。投资有风险，决策需谨慎。</Text>
              <br />
              <Text>• 数据可能存在延迟，请以官方数据为准。</Text>
              <br />
              <Text>• AI分析结果仅供参考，不保证准确性，请结合多方信息独立判断。</Text>
            </div>
          ),
        };
    }
  };

  const { message, description } = getNoticeContent();

  return (
    <Alert
      message={message}
      description={description}
      type="warning"
      showIcon={showIcon}
      icon={<ExclamationCircleOutlined />}
      closable={closable}
      className={`mb-4 ${className}`}
      style={{
        borderRadius: '8px',
        backgroundColor: '#fff7e6',
        borderColor: '#ffd666',
      }}
    />
  );
}

// 导出不同类型的快捷组件
export const InvestmentDisclaimer = (props: Omit<DisclaimerNoticeProps, 'type'>) => (
  <DisclaimerNotice {...props} type="investment" />
);

export const DataDisclaimer = (props: Omit<DisclaimerNoticeProps, 'type'>) => (
  <DisclaimerNotice {...props} type="data" />
);

export const AIDisclaimer = (props: Omit<DisclaimerNoticeProps, 'type'>) => (
  <DisclaimerNotice {...props} type="ai" />
);