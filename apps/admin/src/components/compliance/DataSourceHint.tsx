'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography, Space, Tag } from 'antd';
import {
  InfoCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import {
  DataSourceHintProps,
  DataSourceConfig,
  SupportedLanguage,
  getDataSourceConfig,
  isComplianceEnabled,
  getCurrentLanguage,
  onLanguageChange,
  offLanguageChange,
  getText,
} from '@gulingtong/shared-sdk';

const { Text, Link } = Typography;

/**
 * 数据源提示组件
 * 显示数据来源、延迟信息和提供商信息
 */
export default function DataSourceHint({
  type,
  language,
  className = '',
  showDelay,
  position = 'bottom',
  theme = 'light',
}: DataSourceHintProps) {
  const [config, setConfig] = useState<DataSourceConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    language || getCurrentLanguage()
  );

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);

        // 检查全局开关
        const globalEnabled = await isComplianceEnabled('dataSourceHint');
        if (!globalEnabled) {
          setIsEnabled(false);
          setLoading(false);
          return;
        }

        // 获取配置
        const dataSourceConfig = await getDataSourceConfig(
          type,
          currentLanguage
        );
        if (dataSourceConfig) {
          setConfig(dataSourceConfig);
          setIsEnabled(true);
        } else {
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('Failed to load data source config:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [type, currentLanguage]);

  // 监听语言变化
  useEffect(() => {
    if (!language) {
      const handleLanguageChange = (newLanguage: SupportedLanguage) => {
        setCurrentLanguage(newLanguage);
      };

      onLanguageChange(handleLanguageChange);
      return () => offLanguageChange(handleLanguageChange);
    }
  }, [language]);

  // 当传入的language属性变化时，更新当前语言
  useEffect(() => {
    if (language) {
      setCurrentLanguage(language);
    }
  }, [language]);

  const getDelayTag = () => {
    if (!config?.provider.delay || (!config.showDelay && showDelay !== true)) {
      return null;
    }

    const delayText =
      currentLanguage === 'en'
        ? `${config.provider.delay}min delay`
        : `延迟${config.provider.delay}分钟`;

    return (
      <Tag
        icon={<ClockCircleOutlined />}
        color='orange'
        style={{ marginLeft: 8 }}
      >
        {delayText}
      </Tag>
    );
  };

  const getProviderLink = () => {
    if (!config?.provider.website) {
      return getText(config?.provider.name, currentLanguage);
    }

    return (
      <Link
        href={config.provider.website}
        target='_blank'
        rel='noopener noreferrer'
      >
        <LinkOutlined style={{ marginRight: 4 }} />
        {getText(config.provider.name, currentLanguage)}
      </Link>
    );
  };

  const getPositionStyles = () => {
    const pos = position || config?.position || 'bottom';

    switch (pos) {
      case 'bottom':
        return {
          position: 'fixed' as const,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          margin: 0,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
        };
      case 'top':
        return {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          margin: 0,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
        };
      case 'inline':
      default:
        return {
          borderRadius: '8px',
          marginBottom: '16px',
        };
    }
  };

  const getThemeStyles = () => {
    const currentTheme = theme || config?.theme || 'light';

    switch (currentTheme) {
      case 'dark':
        return {
          backgroundColor: '#262626',
          borderColor: '#434343',
          color: '#ffffff',
        };
      case 'light':
      default:
        return {
          backgroundColor: '#f6ffed',
          borderColor: '#b7eb8f',
        };
    }
  };

  const getDataTypeTag = () => {
    let color = 'default';
    let text = '';

    switch (type) {
      case 'realtime':
        color = 'green';
        text = currentLanguage === 'en' ? 'Real-time' : '实时';
        break;
      case 'delayed':
        color = 'orange';
        text = currentLanguage === 'en' ? 'Delayed' : '延迟';
        break;
      case 'historical':
        color = 'blue';
        text = currentLanguage === 'en' ? 'Historical' : '历史';
        break;
      case 'estimated':
        color = 'purple';
        text = currentLanguage === 'en' ? 'Estimated' : '预估';
        break;
      default:
        return null;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  // 如果正在加载或未启用，不显示组件
  if (loading || !isEnabled || !config) {
    return null;
  }

  const hint = getText(config.hint, currentLanguage);
  const description = getText(config.description, currentLanguage);

  const content = (
    <Space direction='vertical' size={4} style={{ width: '100%' }}>
      <Space wrap>
        <Text type='secondary'>
          {currentLanguage === 'en' ? 'Data provided by:' : '数据来源：'}
        </Text>
        {getProviderLink()}
        {getDataTypeTag()}
        {getDelayTag()}
      </Space>
      {description && (
        <Text type='secondary' style={{ fontSize: '12px' }}>
          {description}
        </Text>
      )}
    </Space>
  );

  return (
    <Alert
      message={hint}
      description={content}
      type='info'
      showIcon
      icon={<InfoCircleOutlined />}
      className={className}
      style={{
        ...getPositionStyles(),
        ...getThemeStyles(),
        fontSize: '13px',
      }}
    />
  );
}

// 导出不同类型的快捷组件
export const RealtimeDataHint = (props: Omit<DataSourceHintProps, 'type'>) => (
  <DataSourceHint {...props} type='realtime' />
);

export const DelayedDataHint = (props: Omit<DataSourceHintProps, 'type'>) => (
  <DataSourceHint {...props} type='delayed' />
);

export const HistoricalDataHint = (
  props: Omit<DataSourceHintProps, 'type'>
) => <DataSourceHint {...props} type='historical' />;

export const EstimatedDataHint = (props: Omit<DataSourceHintProps, 'type'>) => (
  <DataSourceHint {...props} type='estimated' />
);
