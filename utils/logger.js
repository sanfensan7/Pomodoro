/**
 * 统一日志管理系统
 * 用于替代所有的 console.log，支持环境区分和错误上报
 */

class Logger {
  constructor() {
    // 判断是否为生产环境
    // 开发版: develop, 体验版: trial, 正式版: release
    this.envVersion = 'develop'; // 默认开发环境
    this.isDev = true;
    
    // 初始化环境信息
    this.initEnv();
    
    // 错误收集队列
    this.errorQueue = [];
    this.maxQueueSize = 50; // 最多缓存50条错误
    
    // 性能日志队列
    this.perfQueue = [];
  }
  
  /**
   * 初始化环境信息
   */
  initEnv() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      this.envVersion = accountInfo.miniProgram.envVersion || 'develop';
      this.isDev = this.envVersion === 'develop';
    } catch (e) {
      console.warn('获取环境信息失败，默认为开发环境');
    }
  }
  
  /**
   * 普通日志 - 仅开发环境输出
   */
  log(message, data = null) {
    if (this.isDev) {
      if (data) {
        console.log(`[LOG] ${message}`, data);
      } else {
        console.log(`[LOG] ${message}`);
      }
    }
  }
  
  /**
   * 信息日志 - 仅开发环境输出
   */
  info(message, data = null) {
    if (this.isDev) {
      if (data) {
        console.info(`[INFO] ${message}`, data);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  }
  
  /**
   * 警告日志 - 所有环境输出
   */
  warn(message, data = null) {
    if (data) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
    
    // 生产环境收集警告
    if (!this.isDev) {
      this.collectWarning(message, data);
    }
  }
  
  /**
   * 错误日志 - 所有环境输出并上报
   */
  error(message, error = null, context = {}) {
    const errorInfo = {
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      context,
      timestamp: new Date().toISOString(),
      envVersion: this.envVersion
    };
    
    // 控制台输出
    if (error) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      console.error(`[ERROR] ${message}`, context);
    }
    
    // 收集错误用于上报
    this.collectError(errorInfo);
    
    // 生产环境立即上报严重错误
    if (!this.isDev && error) {
      this.reportError(errorInfo);
    }
  }
  
  /**
   * 性能日志
   */
  perf(operation, duration, details = {}) {
    const perfLog = {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    };
    
    if (this.isDev) {
      console.log(`[PERF] ${operation}: ${duration}ms`, details);
    }
    
    // 收集性能数据
    this.perfQueue.push(perfLog);
    if (this.perfQueue.length > this.maxQueueSize) {
      this.perfQueue.shift();
    }
    
    // 性能警告：操作超过3秒
    if (duration > 3000) {
      this.warn(`性能警告：${operation} 耗时 ${duration}ms`, details);
    }
  }
  
  /**
   * 收集错误
   */
  collectError(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    // 超过队列限制，移除最早的错误
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
    
    // 保存到本地存储
    try {
      wx.setStorageSync('error_logs', this.errorQueue);
    } catch (e) {
      console.error('保存错误日志失败', e);
    }
  }
  
  /**
   * 收集警告
   */
  collectWarning(message, data) {
    const warning = {
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    // 可以选择是否保存警告日志
    // 这里暂时只在控制台输出
  }
  
  /**
   * 上报错误到服务器
   * 注意：需要配置后端接口
   */
  reportError(errorInfo) {
    // 如果有配置错误上报服务，在这里实现
    // 例如：使用微信云开发或第三方服务
    
    try {
      // 方案1: 使用微信云开发
      // wx.cloud.callFunction({
      //   name: 'reportError',
      //   data: errorInfo
      // });
      
      // 方案2: 使用HTTP请求（需要配置服务器域名）
      // wx.request({
      //   url: 'https://your-domain.com/api/error-log',
      //   method: 'POST',
      //   data: errorInfo,
      //   fail: (err) => {
      //     console.error('错误上报失败', err);
      //   }
      // });
      
      // 暂时只保存到本地
      this.log('错误已记录，等待上报', errorInfo);
    } catch (e) {
      console.error('错误上报失败', e);
    }
  }
  
  /**
   * 获取所有错误日志
   */
  getErrorLogs() {
    try {
      return wx.getStorageSync('error_logs') || [];
    } catch (e) {
      return this.errorQueue;
    }
  }
  
  /**
   * 清除错误日志
   */
  clearErrorLogs() {
    this.errorQueue = [];
    try {
      wx.removeStorageSync('error_logs');
    } catch (e) {
      console.error('清除错误日志失败', e);
    }
  }
  
  /**
   * 获取性能日志
   */
  getPerfLogs() {
    return this.perfQueue;
  }
  
  /**
   * 调试模式：查看所有日志
   */
  debug(enable = true) {
    if (enable) {
      console.log('=== 调试模式已开启 ===');
      console.log('环境版本:', this.envVersion);
      console.log('错误日志数量:', this.errorQueue.length);
      console.log('性能日志数量:', this.perfQueue.length);
      console.log('最近错误:', this.errorQueue.slice(-5));
      console.log('最近性能:', this.perfQueue.slice(-5));
    }
  }
}

// 创建单例
const logger = new Logger();

// 导出
module.exports = logger;

