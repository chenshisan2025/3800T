// utils/config.js
// 环境配置和域名管理

// 当前环境配置
// 可通过编译时环境变量或运行时检测来确定
const ENV = process.env.NODE_ENV || 'production'; // 'development' | 'test' | 'production'

// 环境配置
const CONFIG = {
  development: {
    // API服务
    API_BASE_URL: 'https://dev-api.gulingtong.com',
    API_BACKUP_URL: 'https://dev-api-backup.gulingtong.com',

    // WebSocket服务
    WS_BASE_URL: 'wss://dev-ws.gulingtong.com',
    WS_BACKUP_URL: 'wss://dev-ws-backup.gulingtong.com',

    // CDN和静态资源
    CDN_BASE_URL: 'https://dev-cdn.gulingtong.com',
    IMG_BASE_URL: 'https://dev-img.gulingtong.com',

    // 文件服务
    UPLOAD_BASE_URL: 'https://dev-upload.gulingtong.com',
    DOWNLOAD_BASE_URL: 'https://dev-download.gulingtong.com',

    // 第三方服务
    FINANCE_API_URL: 'https://dev-api.finance-data.com',

    // 调试配置
    DEBUG: true,
    LOG_LEVEL: 'debug',
  },

  test: {
    // API服务
    API_BASE_URL: 'https://test-api.gulingtong.com',
    API_BACKUP_URL: 'https://test-api-backup.gulingtong.com',

    // WebSocket服务
    WS_BASE_URL: 'wss://test-ws.gulingtong.com',
    WS_BACKUP_URL: 'wss://test-ws-backup.gulingtong.com',

    // CDN和静态资源
    CDN_BASE_URL: 'https://test-cdn.gulingtong.com',
    IMG_BASE_URL: 'https://test-img.gulingtong.com',

    // 文件服务
    UPLOAD_BASE_URL: 'https://test-upload.gulingtong.com',
    DOWNLOAD_BASE_URL: 'https://test-download.gulingtong.com',

    // 第三方服务
    FINANCE_API_URL: 'https://test-api.finance-data.com',

    // 调试配置
    DEBUG: true,
    LOG_LEVEL: 'info',
  },

  production: {
    // API服务
    API_BASE_URL: 'https://api.gulingtong.com',
    API_BACKUP_URL: 'https://api-backup.gulingtong.com',

    // WebSocket服务
    WS_BASE_URL: 'wss://ws.gulingtong.com',
    WS_BACKUP_URL: 'wss://ws-backup.gulingtong.com',

    // CDN和静态资源
    CDN_BASE_URL: 'https://cdn.gulingtong.com',
    IMG_BASE_URL: 'https://img.gulingtong.com',

    // 文件服务
    UPLOAD_BASE_URL: 'https://upload.gulingtong.com',
    DOWNLOAD_BASE_URL: 'https://download.gulingtong.com',

    // 第三方服务
    FINANCE_API_URL: 'https://api.finance-data.com',
    EASTMONEY_API_URL: 'https://quote.eastmoney.com',
    EASTMONEY_PUSH_URL: 'https://push2.eastmoney.com',

    // 微信支付相关
    WECHAT_PAY_URL: 'https://api.mch.weixin.qq.com',

    // 调试配置
    DEBUG: false,
    LOG_LEVEL: 'error',
  },
};

// 获取当前环境配置
const currentConfig = CONFIG[ENV] || CONFIG.production;

// 域名健康检查配置
const HEALTH_CHECK = {
  // 检查间隔（毫秒）
  CHECK_INTERVAL: 30000,
  // 超时时间（毫秒）
  TIMEOUT: 5000,
  // 重试次数
  RETRY_COUNT: 3,
  // 健康检查端点
  HEALTH_ENDPOINT: '/health',
};

// 域名切换配置
const DOMAIN_SWITCH = {
  // 是否启用自动切换
  AUTO_SWITCH: true,
  // 切换阈值（连续失败次数）
  SWITCH_THRESHOLD: 3,
  // 恢复检查间隔（毫秒）
  RECOVERY_CHECK_INTERVAL: 60000,
};

/**
 * 域名管理器
 */
class DomainManager {
  constructor() {
    this.currentDomains = { ...currentConfig };
    this.failureCounts = {};
    this.healthCheckTimer = null;
    this.recoveryCheckTimer = null;

    // 初始化健康检查
    if (DOMAIN_SWITCH.AUTO_SWITCH) {
      this.startHealthCheck();
    }
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl() {
    return this.currentDomains.API_BASE_URL;
  }

  /**
   * 获取WebSocket基础URL
   */
  getWsBaseUrl() {
    return this.currentDomains.WS_BASE_URL;
  }

  /**
   * 获取CDN基础URL
   */
  getCdnBaseUrl() {
    return this.currentDomains.CDN_BASE_URL;
  }

  /**
   * 获取完整的API URL
   */
  getApiUrl(path) {
    const baseUrl = this.getApiBaseUrl();
    return path.startsWith('http') ? path : `${baseUrl}${path}`;
  }

  /**
   * 获取完整的CDN URL
   */
  getCdnUrl(path) {
    const baseUrl = this.getCdnBaseUrl();
    return path.startsWith('http') ? path : `${baseUrl}${path}`;
  }

  /**
   * 记录域名访问失败
   */
  recordFailure(domain) {
    if (!this.failureCounts[domain]) {
      this.failureCounts[domain] = 0;
    }
    this.failureCounts[domain]++;

    // 检查是否需要切换域名
    if (this.failureCounts[domain] >= DOMAIN_SWITCH.SWITCH_THRESHOLD) {
      this.switchToBackupDomain(domain);
    }
  }

  /**
   * 记录域名访问成功
   */
  recordSuccess(domain) {
    this.failureCounts[domain] = 0;
  }

  /**
   * 切换到备用域名
   */
  switchToBackupDomain(domain) {
    if (!DOMAIN_SWITCH.AUTO_SWITCH) return;

    const backupMapping = {
      [currentConfig.API_BASE_URL]: currentConfig.API_BACKUP_URL,
      [currentConfig.WS_BASE_URL]: currentConfig.WS_BACKUP_URL,
    };

    const backupDomain = backupMapping[domain];
    if (backupDomain) {
      console.warn(`切换到备用域名: ${domain} -> ${backupDomain}`);

      // 更新当前域名配置
      if (domain === currentConfig.API_BASE_URL) {
        this.currentDomains.API_BASE_URL = backupDomain;
      } else if (domain === currentConfig.WS_BASE_URL) {
        this.currentDomains.WS_BASE_URL = backupDomain;
      }

      // 启动恢复检查
      this.startRecoveryCheck(domain, backupDomain);
    }
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK.CHECK_INTERVAL);
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    const domains = [
      this.currentDomains.API_BASE_URL,
      this.currentDomains.WS_BASE_URL,
    ];

    for (const domain of domains) {
      try {
        await this.checkDomainHealth(domain);
        this.recordSuccess(domain);
      } catch (error) {
        console.warn(`域名健康检查失败: ${domain}`, error);
        this.recordFailure(domain);
      }
    }
  }

  /**
   * 检查域名健康状态
   */
  checkDomainHealth(domain) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('健康检查超时'));
      }, HEALTH_CHECK.TIMEOUT);

      wx.request({
        url: `${domain}${HEALTH_CHECK.HEALTH_ENDPOINT}`,
        method: 'GET',
        timeout: HEALTH_CHECK.TIMEOUT,
        success: res => {
          clearTimeout(timer);
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`健康检查失败: ${res.statusCode}`));
          }
        },
        fail: error => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  /**
   * 启动恢复检查
   */
  startRecoveryCheck(originalDomain, backupDomain) {
    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
    }

    this.recoveryCheckTimer = setInterval(async () => {
      try {
        await this.checkDomainHealth(originalDomain);
        console.log(`原域名已恢复: ${originalDomain}`);

        // 恢复到原域名
        if (originalDomain === currentConfig.API_BASE_URL) {
          this.currentDomains.API_BASE_URL = originalDomain;
        } else if (originalDomain === currentConfig.WS_BASE_URL) {
          this.currentDomains.WS_BASE_URL = originalDomain;
        }

        // 重置失败计数
        this.failureCounts[originalDomain] = 0;

        // 停止恢复检查
        clearInterval(this.recoveryCheckTimer);
        this.recoveryCheckTimer = null;
      } catch (error) {
        console.log(`原域名仍未恢复: ${originalDomain}`);
      }
    }, DOMAIN_SWITCH.RECOVERY_CHECK_INTERVAL);
  }

  /**
   * 停止所有检查
   */
  stopAllChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
      this.recoveryCheckTimer = null;
    }
  }

  /**
   * 获取当前配置信息
   */
  getConfigInfo() {
    return {
      environment: ENV,
      currentDomains: this.currentDomains,
      failureCounts: this.failureCounts,
      healthCheck: HEALTH_CHECK,
      domainSwitch: DOMAIN_SWITCH,
    };
  }
}

// 创建域名管理器实例
const domainManager = new DomainManager();

// 导出配置和管理器
module.exports = {
  // 基础配置
  ENV,
  CONFIG: currentConfig,

  // 域名管理器
  domainManager,

  // 便捷访问方法
  getApiUrl: path => domainManager.getApiUrl(path),
  getCdnUrl: path => domainManager.getCdnUrl(path),
  getWsUrl: () => domainManager.getWsBaseUrl(),

  // 配置常量
  HEALTH_CHECK,
  DOMAIN_SWITCH,

  // 兼容性导出（保持向后兼容）
  API_BASE_URL: domainManager.getApiBaseUrl(),
  WS_BASE_URL: domainManager.getWsBaseUrl(),
  CDN_BASE_URL: domainManager.getCdnBaseUrl(),
};
