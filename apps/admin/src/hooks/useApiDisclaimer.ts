'use client';

import { useEffect, useState } from 'react';
import { message } from 'antd';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  disclaimer?: {
    investment_notice: string;
    data_notice: string;
    ai_notice: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

interface UseApiDisclaimerOptions {
  showInvestmentNotice?: boolean;
  showDataNotice?: boolean;
  showAiNotice?: boolean;
  autoShow?: boolean;
}

export function useApiDisclaimer(options: UseApiDisclaimerOptions = {}) {
  const {
    showInvestmentNotice = true,
    showDataNotice = false,
    showAiNotice = false,
    autoShow = true,
  } = options;

  const [disclaimerShown, setDisclaimerShown] = useState(false);

  const showDisclaimer = (disclaimer: ApiResponse['disclaimer']) => {
    if (!disclaimer || disclaimerShown) return;

    const notices: string[] = [];
    
    if (showInvestmentNotice && disclaimer.investment_notice) {
      notices.push(disclaimer.investment_notice);
    }
    
    if (showDataNotice && disclaimer.data_notice) {
      notices.push(disclaimer.data_notice);
    }
    
    if (showAiNotice && disclaimer.ai_notice) {
      notices.push(disclaimer.ai_notice);
    }

    if (notices.length > 0) {
      message.warning({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>重要提示</div>
            {notices.map((notice, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                • {notice}
              </div>
            ))}
          </div>
        ),
        duration: 8,
        style: {
          marginTop: '20vh',
        },
      });
      setDisclaimerShown(true);
    }
  };

  const processApiResponse = <T>(response: ApiResponse<T>): ApiResponse<T> => {
    if (autoShow && response.success && response.disclaimer) {
      showDisclaimer(response.disclaimer);
    }
    return response;
  };

  const resetDisclaimer = () => {
    setDisclaimerShown(false);
  };

  return {
    showDisclaimer,
    processApiResponse,
    resetDisclaimer,
    disclaimerShown,
  };
}

// 专门用于股票相关API的Hook
export function useStockApiDisclaimer() {
  return useApiDisclaimer({
    showInvestmentNotice: true,
    showDataNotice: true,
    showAiNotice: false,
    autoShow: true,
  });
}

// 专门用于AI分析相关API的Hook
export function useAiApiDisclaimer() {
  return useApiDisclaimer({
    showInvestmentNotice: true,
    showDataNotice: false,
    showAiNotice: true,
    autoShow: true,
  });
}