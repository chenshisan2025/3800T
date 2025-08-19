// 简化的logger实现，完全兼容Edge Runtime
class SimpleLogger {
  private serviceName = 'gulingtong-api';
  
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }
  
  error(message: string, meta?: any): void {
    console.error(this.formatMessage('error', message, meta));
  }
  
  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }
  
  info(message: string, meta?: any): void {
    console.info(this.formatMessage('info', message, meta));
  }
  
  http(message: string, meta?: any): void {
    console.log(this.formatMessage('http', message, meta));
  }
  
  debug(message: string, meta?: any): void {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

const logger = new SimpleLogger();

// API 请求日志中间件
export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.error(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// 错误日志记录
export const logError = (error: Error, context?: string) => {
  const message = context 
    ? `[${context}] ${error.message}` 
    : error.message;
  
  logger.error(message, {
    stack: error.stack,
    context,
  });
};

// 信息日志记录
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

// 警告日志记录
export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

// 调试日志记录
export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger;