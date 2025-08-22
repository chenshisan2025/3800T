'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  AlertTriangleIcon,
  BotIcon,
} from '@ant-design/icons';
import {
  DisclaimerProps,
  DisclaimerConfig,
  SupportedLanguage,
  getDisclaimerConfig,
  isComplianceEnabled,
  getCurrentLanguage,
  onLanguageChange,
  offLanguageChange,
  getText,
} from '@gulingtong/shared-sdk';

const { Text } = Typography;

/**
 * 合规免责声明组件
 * 支持配置管理、国际化和全局开关
 */
export default function Disclaimer({
  type,
  language,
  className = '',
  showIcon,
  closable,
  position = 'bottom',
  theme = 'light',
  onClose,
}: DisclaimerProps) {
  const [config, setConfig] = useState<DisclaimerConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [visible, setVisible] = useState<boolean>(true);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    language || getCurrentLanguage()
  );

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);

        // 检查全局开关
        const globalEnabled = await isComplianceEnabled('disclaimer');
        if (!globalEnabled) {
          setIsEnabled(false);
          setLoading(false);
          return;
        }

        // 获取配置
        const disclaimerConfig = await getDisclaimerConfig(
          type,
          currentLanguage
        );
        if (disclaimerConfig) {
          setConfig(disclaimerConfig);
          setIsEnabled(true);
        } else {
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('Failed to load disclaimer config:', error);
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

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const getIcon = () => {
    if (!config?.showIcon && showIcon === undefined) return null;
    if (showIcon === false) return null;

    switch (config?.iconName || type) {
      case 'alert-triangle':
      case 'investment':
        return <ExclamationCircleOutlined />;
      case 'bot':
      case 'ai':
        return <BotIcon />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  const getAlertType = () => {
    switch (type) {
      case 'investment':
        return 'warning';
      case 'ai':
        return 'info';
      case 'data':
        return 'warning';
      default:
        return 'warning';
    }
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
          zIndex: 1000,
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
          zIndex: 1000,
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
          backgroundColor: '#1f1f1f',
          borderColor: '#434343',
          color: '#ffffff',
        };
      case 'light':
      default:
        return {
          backgroundColor: '#fff7e6',
          borderColor: '#ffd666',
        };
    }
  };

  // 如果正在加载或未启用，不显示组件
  if (loading || !isEnabled || !config || !visible) {
    return null;
  }

  const title = getText(config.title, currentLanguage);
  const content = getText(config.content, currentLanguage);
  const isClosable = closable !== undefined ? closable : config.closable;

  return (
    <Alert
      message={title}
      description={content}
      type={getAlertType()}
      showIcon={getIcon() !== null}
      icon={getIcon()}
      closable={isClosable}
      onClose={handleClose}
      className={className}
      style={{
        ...getPositionStyles(),
        ...getThemeStyles(),
      }}
    />
  );
}

// 导出不同类型的快捷组件
export const InvestmentDisclaimer = (props: Omit<DisclaimerProps, 'type'>) => (
  <Disclaimer {...props} type='investment' />
);

export const DataDisclaimer = (props: Omit<DisclaimerProps, 'type'>) => (
  <Disclaimer {...props} type='data' />
);

export const AIDisclaimer = (props: Omit<DisclaimerProps, 'type'>) => (
  <Disclaimer {...props} type='ai' />
);

export const GeneralDisclaimer = (props: Omit<DisclaimerProps, 'type'>) => (
  <Disclaimer {...props} type='general' />
);
