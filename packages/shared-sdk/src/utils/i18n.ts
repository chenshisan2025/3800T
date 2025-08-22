/**
 * 国际化工具函数
 * 提供语言切换和文本获取功能
 */

import { SupportedLanguage, I18nText } from '../types/compliance';

// ============================================================================
// 语言检测和管理
// ============================================================================

/**
 * 获取当前系统语言
 */
export function getSystemLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    const lang = navigator.language || navigator.languages?.[0] || 'zh';
    return lang.startsWith('zh') ? 'zh' : 'en';
  }

  if (typeof process !== 'undefined' && process.env) {
    // Node.js 环境
    const lang = process.env['LANG'] || process.env['LANGUAGE'] || 'zh';
    return lang.startsWith('zh') ? 'zh' : 'en';
  }

  // 默认中文
  return 'zh';
}

/**
 * 语言管理器
 */
export class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: SupportedLanguage;
  private listeners: Array<(language: SupportedLanguage) => void> = [];

  private constructor() {
    this.currentLanguage =
      this.loadLanguageFromStorage() || getSystemLanguage();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  /**
   * 获取当前语言
   */
  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 设置当前语言
   */
  public setLanguage(language: SupportedLanguage): void {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      this.saveLanguageToStorage(language);
      this.notifyListeners(language);
    }
  }

  /**
   * 添加语言变化监听器
   */
  public addListener(listener: (language: SupportedLanguage) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除语言变化监听器
   */
  public removeListener(listener: (language: SupportedLanguage) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 从存储中加载语言设置
   */
  private loadLanguageFromStorage(): SupportedLanguage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('compliance_language');
      return stored === 'zh' || stored === 'en' ? stored : null;
    }
    return null;
  }

  /**
   * 保存语言设置到存储
   */
  private saveLanguageToStorage(language: SupportedLanguage): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('compliance_language', language);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(language: SupportedLanguage): void {
    this.listeners.forEach(listener => {
      try {
        listener(language);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }
}

// ============================================================================
// 文本获取工具函数
// ============================================================================

/**
 * 根据当前语言获取文本
 */
export function getText(
  i18nText: I18nText,
  language?: SupportedLanguage
): string {
  const lang = language || LanguageManager.getInstance().getCurrentLanguage();
  return i18nText[lang] || i18nText.zh || i18nText.en || '';
}

/**
 * 创建国际化文本对象
 */
export function createI18nText(zh: string, en: string): I18nText {
  return { zh, en };
}

/**
 * 检查是否为有效的国际化文本对象
 */
export function isValidI18nText(obj: any): obj is I18nText {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.zh === 'string' &&
    typeof obj.en === 'string'
  );
}

// ============================================================================
// 快捷方法
// ============================================================================

/**
 * 获取语言管理器实例
 */
export const getLanguageManager = () => LanguageManager.getInstance();

/**
 * 获取当前语言
 */
export const getCurrentLanguage = () =>
  getLanguageManager().getCurrentLanguage();

/**
 * 设置当前语言
 */
export const setCurrentLanguage = (language: SupportedLanguage) => {
  getLanguageManager().setLanguage(language);
};

/**
 * 切换语言（中英文互换）
 */
export const toggleLanguage = () => {
  const current = getCurrentLanguage();
  setCurrentLanguage(current === 'zh' ? 'en' : 'zh');
};

/**
 * 添加语言变化监听器
 */
export const onLanguageChange = (
  listener: (language: SupportedLanguage) => void
) => {
  getLanguageManager().addListener(listener);
};

/**
 * 移除语言变化监听器
 */
export const offLanguageChange = (
  listener: (language: SupportedLanguage) => void
) => {
  getLanguageManager().removeListener(listener);
};

// ============================================================================
// 常用文案
// ============================================================================

/**
 * 常用的国际化文案
 */
export const CommonTexts = {
  close: createI18nText('关闭', 'Close'),
  confirm: createI18nText('确认', 'Confirm'),
  cancel: createI18nText('取消', 'Cancel'),
  ok: createI18nText('确定', 'OK'),
  loading: createI18nText('加载中...', 'Loading...'),
  error: createI18nText('错误', 'Error'),
  success: createI18nText('成功', 'Success'),
  warning: createI18nText('警告', 'Warning'),
  info: createI18nText('信息', 'Info'),
  retry: createI18nText('重试', 'Retry'),
  refresh: createI18nText('刷新', 'Refresh'),
  save: createI18nText('保存', 'Save'),
  edit: createI18nText('编辑', 'Edit'),
  delete: createI18nText('删除', 'Delete'),
  view: createI18nText('查看', 'View'),
  more: createI18nText('更多', 'More'),
  less: createI18nText('收起', 'Less'),
  expand: createI18nText('展开', 'Expand'),
  collapse: createI18nText('收起', 'Collapse'),
};
