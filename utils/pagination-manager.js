/**
 * 分页加载管理器
 * 用于大数据量的分页加载，避免一次性加载过多数据导致性能问题
 */

const logger = require('./logger');
const perfMonitor = require('./performance-monitor');

class PaginationManager {
  constructor(options = {}) {
    // 默认配置
    this.config = {
      pageSize: 20,              // 每页数量
      initialPage: 1,            // 初始页码
      enableCache: true,         // 是否启用缓存
      preloadNext: true,         // 是否预加载下一页
      ...options
    };
    
    // 状态
    this.currentPage = this.config.initialPage;
    this.totalPages = 0;
    this.totalCount = 0;
    this.hasMore = true;
    this.loading = false;
    
    // 缓存
    this.cache = new Map();
    this.allData = [];
  }
  
  /**
   * 设置数据源
   * @param {Array} data - 完整数据数组
   */
  setData(data) {
    this.allData = data || [];
    this.totalCount = this.allData.length;
    this.totalPages = Math.ceil(this.totalCount / this.config.pageSize);
    this.hasMore = this.currentPage < this.totalPages;
    
    logger.log('分页数据已设置', {
      总数: this.totalCount,
      总页数: this.totalPages,
      每页数量: this.config.pageSize
    });
    
    // 清除缓存
    if (this.config.enableCache) {
      this.cache.clear();
    }
  }
  
  /**
   * 获取指定页的数据
   * @param {number} page - 页码（从1开始）
   * @returns {Array} 该页的数据
   */
  getPage(page = this.currentPage) {
    const tracker = perfMonitor.trackDataLoad(`分页加载-第${page}页`, this.config.pageSize);
    
    try {
      // 检查缓存
      if (this.config.enableCache && this.cache.has(page)) {
        logger.log(`从缓存加载第${page}页`);
        tracker.end({ cached: true });
        return this.cache.get(page);
      }
      
      // 计算数据范围
      const startIndex = (page - 1) * this.config.pageSize;
      const endIndex = Math.min(startIndex + this.config.pageSize, this.totalCount);
      
      // 获取数据
      const pageData = this.allData.slice(startIndex, endIndex);
      
      // 缓存数据
      if (this.config.enableCache) {
        this.cache.set(page, pageData);
      }
      
      logger.log(`加载第${page}页`, {
        起始索引: startIndex,
        结束索引: endIndex,
        数据量: pageData.length
      });
      
      tracker.end({ 
        cached: false,
        count: pageData.length
      });
      
      return pageData;
      
    } catch (error) {
      logger.error('分页加载失败', error, { page });
      tracker.end({ error: true });
      return [];
    }
  }
  
  /**
   * 加载下一页
   * @returns {Object} { data, hasMore, currentPage }
   */
  loadNext() {
    if (!this.hasMore) {
      logger.log('已经是最后一页');
      return {
        data: [],
        hasMore: false,
        currentPage: this.currentPage
      };
    }
    
    if (this.loading) {
      logger.warn('正在加载中，请勿重复调用');
      return null;
    }
    
    this.loading = true;
    this.currentPage++;
    
    const data = this.getPage(this.currentPage);
    this.hasMore = this.currentPage < this.totalPages;
    
    // 预加载下一页
    if (this.config.preloadNext && this.hasMore) {
      setTimeout(() => {
        this.getPage(this.currentPage + 1);
      }, 100);
    }
    
    this.loading = false;
    
    return {
      data,
      hasMore: this.hasMore,
      currentPage: this.currentPage
    };
  }
  
  /**
   * 加载上一页
   */
  loadPrev() {
    if (this.currentPage <= 1) {
      logger.log('已经是第一页');
      return {
        data: [],
        hasPrev: false,
        currentPage: this.currentPage
      };
    }
    
    this.currentPage--;
    const data = this.getPage(this.currentPage);
    
    return {
      data,
      hasPrev: this.currentPage > 1,
      currentPage: this.currentPage
    };
  }
  
  /**
   * 重置到第一页
   */
  reset() {
    this.currentPage = this.config.initialPage;
    this.hasMore = this.totalPages > 1;
    this.loading = false;
    
    if (this.config.enableCache) {
      this.cache.clear();
    }
    
    logger.log('分页已重置');
  }
  
  /**
   * 跳转到指定页
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) {
      logger.warn(`页码超出范围: ${page}`, {
        有效范围: `1-${this.totalPages}`
      });
      return null;
    }
    
    this.currentPage = page;
    this.hasMore = this.currentPage < this.totalPages;
    
    return {
      data: this.getPage(page),
      currentPage: this.currentPage,
      hasMore: this.hasMore
    };
  }
  
  /**
   * 获取所有已加载的数据
   */
  getAllLoadedData() {
    const allLoaded = [];
    
    for (let i = 1; i <= this.currentPage; i++) {
      const pageData = this.getPage(i);
      allLoaded.push(...pageData);
    }
    
    return allLoaded;
  }
  
  /**
   * 搜索数据（带分页）
   * @param {Function} filterFn - 过滤函数
   * @returns {PaginationManager} 新的分页管理器实例
   */
  search(filterFn) {
    const tracker = perfMonitor.trackDataLoad('分页搜索', this.totalCount);
    
    const filteredData = this.allData.filter(filterFn);
    
    logger.log('搜索完成', {
      原始数量: this.totalCount,
      过滤后数量: filteredData.length
    });
    
    tracker.end({ 
      originalCount: this.totalCount,
      filteredCount: filteredData.length
    });
    
    // 创建新的分页管理器
    const newPagination = new PaginationManager(this.config);
    newPagination.setData(filteredData);
    
    return newPagination;
  }
  
  /**
   * 排序数据
   * @param {Function} compareFn - 比较函数
   */
  sort(compareFn) {
    const tracker = perfMonitor.trackDataLoad('分页排序', this.totalCount);
    
    this.allData.sort(compareFn);
    
    // 清除缓存
    if (this.config.enableCache) {
      this.cache.clear();
    }
    
    logger.log('排序完成');
    tracker.end();
  }
  
  /**
   * 获取分页信息
   */
  getInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalCount: this.totalCount,
      pageSize: this.config.pageSize,
      hasMore: this.hasMore,
      loading: this.loading,
      cacheSize: this.cache.size
    };
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    logger.log('分页缓存已清除');
  }
}

module.exports = PaginationManager;

