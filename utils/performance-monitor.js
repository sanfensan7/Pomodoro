/**
 * 性能监控工具
 * 用于追踪页面加载、数据操作等性能指标
 */

const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    // 性能追踪记录
    this.traces = new Map();
    
    // 性能统计
    this.stats = {
      pageLoad: [],
      dataLoad: [],
      imageLoad: [],
      render: []
    };
  }
  
  /**
   * 开始追踪
   * @param {string} name - 追踪名称
   * @param {object} metadata - 元数据
   */
  start(name, metadata = {}) {
    this.traces.set(name, {
      startTime: Date.now(),
      metadata
    });
  }
  
  /**
   * 结束追踪
   * @param {string} name - 追踪名称
   * @param {object} additionalData - 额外数据
   */
  end(name, additionalData = {}) {
    const trace = this.traces.get(name);
    
    if (!trace) {
      logger.warn(`性能追踪 "${name}" 不存在`);
      return;
    }
    
    const duration = Date.now() - trace.startTime;
    const perfData = {
      name,
      duration,
      ...trace.metadata,
      ...additionalData,
      timestamp: new Date().toISOString()
    };
    
    // 记录性能日志
    logger.perf(name, duration, perfData);
    
    // 分类存储
    this.categorizePerf(name, perfData);
    
    // 清除追踪
    this.traces.delete(name);
    
    return duration;
  }
  
  /**
   * 分类性能数据
   */
  categorizePerf(name, data) {
    if (name.includes('page') || name.includes('Page')) {
      this.stats.pageLoad.push(data);
    } else if (name.includes('data') || name.includes('Data')) {
      this.stats.dataLoad.push(data);
    } else if (name.includes('image') || name.includes('Image')) {
      this.stats.imageLoad.push(data);
    } else if (name.includes('render') || name.includes('Render')) {
      this.stats.render.push(data);
    }
    
    // 保持最近50条记录
    Object.keys(this.stats).forEach(key => {
      if (this.stats[key].length > 50) {
        this.stats[key] = this.stats[key].slice(-50);
      }
    });
  }
  
  /**
   * 追踪页面加载性能
   * 使用方式：
   * const tracker = perfMonitor.trackPageLoad('mistakes');
   * // ... 页面加载逻辑
   * tracker.end();
   */
  trackPageLoad(pageName) {
    const trackName = `PageLoad:${pageName}`;
    this.start(trackName, { type: 'pageLoad', page: pageName });
    
    return {
      end: (additionalData) => this.end(trackName, additionalData)
    };
  }
  
  /**
   * 追踪数据加载性能
   */
  trackDataLoad(dataName, recordCount = 0) {
    const trackName = `DataLoad:${dataName}`;
    this.start(trackName, { 
      type: 'dataLoad', 
      dataName,
      recordCount 
    });
    
    return {
      end: (additionalData) => this.end(trackName, additionalData)
    };
  }
  
  /**
   * 追踪图片加载性能
   */
  trackImageLoad(imageName, size = 0) {
    const trackName = `ImageLoad:${imageName}`;
    this.start(trackName, { 
      type: 'imageLoad',
      imageName,
      size
    });
    
    return {
      end: (additionalData) => this.end(trackName, additionalData)
    };
  }
  
  /**
   * 追踪渲染性能
   */
  trackRender(componentName, itemCount = 0) {
    const trackName = `Render:${componentName}`;
    this.start(trackName, { 
      type: 'render',
      componentName,
      itemCount
    });
    
    return {
      end: (additionalData) => this.end(trackName, additionalData)
    };
  }
  
  /**
   * 获取性能统计
   */
  getStats(category = null) {
    if (category) {
      return this.stats[category] || [];
    }
    return this.stats;
  }
  
  /**
   * 获取平均性能
   */
  getAveragePerf(category) {
    const data = this.stats[category];
    if (!data || data.length === 0) return 0;
    
    const total = data.reduce((sum, item) => sum + item.duration, 0);
    return Math.round(total / data.length);
  }
  
  /**
   * 生成性能报告
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      categories: {}
    };
    
    Object.keys(this.stats).forEach(category => {
      const data = this.stats[category];
      if (data.length > 0) {
        const durations = data.map(item => item.duration);
        report.categories[category] = {
          count: data.length,
          average: Math.round(durations.reduce((a, b) => a + b, 0) / data.length),
          min: Math.min(...durations),
          max: Math.max(...durations),
          latest: data.slice(-5)
        };
      }
    });
    
    return report;
  }
  
  /**
   * 打印性能报告
   */
  printReport() {
    const report = this.generateReport();
    
    console.log('====== 性能监控报告 ======');
    console.log('生成时间:', report.timestamp);
    console.log('');
    
    Object.keys(report.categories).forEach(category => {
      const stats = report.categories[category];
      console.log(`【${category}】`);
      console.log(`  记录数: ${stats.count}`);
      console.log(`  平均耗时: ${stats.average}ms`);
      console.log(`  最快: ${stats.min}ms`);
      console.log(`  最慢: ${stats.max}ms`);
      console.log('');
    });
    
    console.log('=========================');
  }
  
  /**
   * 清除统计数据
   */
  clear(category = null) {
    if (category) {
      this.stats[category] = [];
    } else {
      Object.keys(this.stats).forEach(key => {
        this.stats[key] = [];
      });
    }
  }
}

// 创建单例
const perfMonitor = new PerformanceMonitor();

module.exports = perfMonitor;

