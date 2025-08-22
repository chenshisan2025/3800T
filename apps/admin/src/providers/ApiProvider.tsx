'use client';

import React, { createContext, useContext, useMemo } from 'react';
import {
  createGulingtongClient,
  GulingtongClient,
} from '@gulingtong/shared-sdk';

interface ApiContextType {
  // 保留接口定义以防其他地方需要
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: React.ReactNode;
}

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value: ApiContextType = {
    // 空实现，保留Provider结构
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export function useApi(): ApiContextType {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// 便捷的 hooks
export function useApiServices() {
  // 空实现，保持兼容性
  return null;
}

export function useApiClient() {
  // 空实现，保持兼容性
  return null;
}
