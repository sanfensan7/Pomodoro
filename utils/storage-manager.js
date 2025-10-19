/**
 * 统一存储管理器
 * 提供统一的数据持久化接口，包含版本管理、数据迁移、命名空间隔离
 */

const logger = require('./logger');

class StorageManager {
  constructor() {
    this.version = '1.2.4';
    this.namespace = 'pomodoro_';
    this.versionKey = this.namespace + 'version';
    
    // 数据键映射表
    this.keys = {
      // 专注相关
      FOCUS_DURATION: 'focusDuration',
      SHORT_BREAK_DURATION: 'shortBreakDuration',
      LONG_BREAK_DURATION: 'longBreakDuration',
      LONG_BREAK_INTERVAL: 'longBreakInterval',
      
      // 统计数据
      TODAY_STATS: 'todayStats',
      WEEK_STATS: 'weekStats',
      ALL_DAY_STATS: 'allDayStats',
      FOCUS_HISTORY: 'focusHistory',
      FOCUS_STATS: 'focusStats',
      
      // 任务相关
      TASKS: 'tasks',
      CURRENT_TASK: 'currentTask',
      
      // 错题本
      MISTAKES: 'mistakes',
      MISTAKES_INITIALIZED: 'mistakes_initialized',
      SUBJECTS: 'subjects',
      
      // 设置
      THEME_COLOR: 'themeColor',
      CURRENT_THEME: 'currentTheme',
      TIMER_STYLE: 'timerStyle',
      AUTO_START_BREAK: 'autoStartBreak',
      AUTO_START_FOCUS: 'autoStartFocus',
      KEEP_SCREEN_ON: 'keepScreenOn',
      VIBRATE_ENABLED: 'vibrateEnabled',
      POPUP_ENABLED: 'popupEnabled',
      REPEAT_INDEX: 'repeatIndex',
      REMINDER_INTERVAL_INDEX: 'reminderIntervalIndex',
      
      // 成就系统
      USER_LEVEL: 'userLevel',
      CURRENT_EXP: 'currentExp',
      ACHIEVEMENTS: 'achievements',
      TOTAL_SESSIONS: 'totalSessions',
      TOTAL_FOCUS_TIME: 'totalFocusTime',
      CURRENT_STREAK: 'currentStreak',
      MAX_STREAK: 'maxStreak',
      LAST_FOCUS_DATE: 'lastFocusDate',
      
      // 目标系统
      DAILY_GOAL: 'dailyGoal',
      WEEKLY_GOAL: 'weeklyGoal',
      
      // 错误日志
      ERROR_LOGS: 'error_logs'
    };
    
    // 初始化版本检查
    this.checkVersion();
  }
  
  /**
   * 检查版本并执行数据迁移
   */
  checkVersion() {
    try {
      const savedVersion = wx.getStorageSync(this.versionKey);
      
      if (savedVersion !== this.version) {
        logger.log('检测到版本变化', { from: savedVersion, to: this.version });
        this.migrate(savedVersion, this.version);
        wx.setStorageSync(this.versionKey, this.version);
      }
    } catch (error) {
      logger.error('版本检查失败', error);
    }
  }
  
  /**
   * 获取数据
   * @param {string} key - 数据键
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key);
      
      // 处理不同类型的空值
      if (value === '' || value === undefined || value === null) {
        return defaultValue;
      }
      
      return value;
    } catch (error) {
      logger.error('读取存储失败', error, { key });
      return defaultValue;
    }
  }
  
  /**
   * 设置数据
   * @param {string} key - 数据键
   * @param {*} value - 要存储的值
   * @returns {boolean} 是否成功
   */
  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (error) {
      logger.error('写入存储失败', error, { key, value });
      return false;
    }
  }
  
  /**
   * 删除数据
   * @param {string} key - 数据键
   * @returns {boolean} 是否成功
   */
  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      logger.error('删除存储失败', error, { key });
      return false;
    }
  }
  
  /**
   * 批量获取数据
   * @param {string[]} keys - 数据键数组
   * @returns {Object} 键值对对象
   */
  getBatch(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }
  
  /**
   * 批量设置数据
   * @param {Object} data - 键值对对象
   * @returns {boolean} 是否全部成功
   */
  setBatch(data) {
    try {
      Object.keys(data).forEach(key => {
        wx.setStorageSync(key, data[key]);
      });
      return true;
    } catch (error) {
      logger.error('批量写入存储失败', error);
      return false;
    }
  }
  
  /**
   * 清除所有数据（慎用！）
   * @param {boolean} keepSettings - 是否保留设置
   * @returns {boolean} 是否成功
   */
  clearAll(keepSettings = true) {
    try {
      if (keepSettings) {
        // 保存设置相关的数据
        const settings = this.getBatch([
          this.keys.THEME_COLOR,
          this.keys.CURRENT_THEME,
          this.keys.TIMER_STYLE,
          this.keys.FOCUS_DURATION,
          this.keys.SHORT_BREAK_DURATION,
          this.keys.LONG_BREAK_DURATION,
          this.keys.LONG_BREAK_INTERVAL,
          this.keys.AUTO_START_BREAK,
          this.keys.AUTO_START_FOCUS,
          this.keys.KEEP_SCREEN_ON,
          this.keys.VIBRATE_ENABLED,
          this.keys.POPUP_ENABLED
        ]);
        
        // 清除所有数据
        wx.clearStorageSync();
        
        // 恢复设置
        this.setBatch(settings);
        wx.setStorageSync(this.versionKey, this.version);
      } else {
        wx.clearStorageSync();
      }
      
      logger.warn('存储数据已清除', { keepSettings });
      return true;
    } catch (error) {
      logger.error('清除存储失败', error);
      return false;
    }
  }
  
  /**
   * 获取存储信息
   * @returns {Object} 存储信息
   */
  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      return {
        keys: info.keys,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        usage: ((info.currentSize / info.limitSize) * 100).toFixed(2) + '%'
      };
    } catch (error) {
      logger.error('获取存储信息失败', error);
      return null;
    }
  }
  
  /**
   * 数据迁移
   * @param {string} fromVersion - 旧版本号
   * @param {string} toVersion - 新版本号
   */
  migrate(fromVersion, toVersion) {
    try {
      logger.log('开始数据迁移', { fromVersion, toVersion });
      
      // 如果是首次安装（没有旧版本）
      if (!fromVersion) {
        this.initializeDefaultData();
        return;
      }
      
      // 版本特定的迁移逻辑
      if (this.compareVersion(fromVersion, '1.2.0') < 0) {
        this.migrateToV120();
      }
      
      if (this.compareVersion(fromVersion, '1.2.3') < 0) {
        this.migrateToV123();
      }
      
      if (this.compareVersion(fromVersion, '1.2.4') < 0) {
        this.migrateToV124();
      }
      
      logger.log('数据迁移完成');
    } catch (error) {
      logger.error('数据迁移失败', error);
    }
  }
  
  /**
   * 初始化默认数据
   */
  initializeDefaultData() {
    const defaults = {
      [this.keys.FOCUS_DURATION]: 25,
      [this.keys.SHORT_BREAK_DURATION]: 5,
      [this.keys.LONG_BREAK_DURATION]: 15,
      [this.keys.LONG_BREAK_INTERVAL]: 4,
      [this.keys.AUTO_START_BREAK]: true,
      [this.keys.AUTO_START_FOCUS]: false,
      [this.keys.KEEP_SCREEN_ON]: true,
      [this.keys.VIBRATE_ENABLED]: true,
      [this.keys.POPUP_ENABLED]: true,
      [this.keys.THEME_COLOR]: '#ff6b6b',
      [this.keys.CURRENT_THEME]: 'red',
      [this.keys.TIMER_STYLE]: 'circle',
      [this.keys.TASKS]: [],
      [this.keys.TODAY_STATS]: {
        date: new Date().toDateString(),
        completed: 0,
        focusTime: 0 // 单位：分钟
      },
      [this.keys.USER_LEVEL]: 1,
      [this.keys.CURRENT_EXP]: 0,
      [this.keys.CURRENT_STREAK]: 0,
      [this.keys.MAX_STREAK]: 0
    };
    
    this.setBatch(defaults);
    logger.log('默认数据已初始化');
  }
  
  /**
   * 迁移到 v1.2.0（错题本系统）
   */
  migrateToV120() {
    logger.log('执行 v1.2.0 迁移');
    // 初始化错题本相关数据
    if (!this.get(this.keys.MISTAKES)) {
      this.set(this.keys.MISTAKES, []);
    }
    if (!this.get(this.keys.SUBJECTS)) {
      this.set(this.keys.SUBJECTS, []);
    }
  }
  
  /**
   * 迁移到 v1.2.3（FocusStatsManager）
   */
  migrateToV123() {
    logger.log('执行 v1.2.3 迁移');
    
    // 迁移旧的统计数据到新的 FocusStatsManager 格式
    const todayStats = this.get(this.keys.TODAY_STATS, { completed: 0, focusTime: 0 });
    const allDayStats = this.get(this.keys.ALL_DAY_STATS, {});
    
    // 将旧的 focusTime 单位从"小时"转换为"分钟"
    // 注意：这里假设旧版本的 focusTime 单位混乱，需要检测和修正
    Object.keys(allDayStats).forEach(date => {
      const stats = allDayStats[date];
      if (stats.focusTime && stats.focusTime < 100) {
        // 如果小于100，可能是小时，转换为分钟
        stats.focusTime = stats.focusTime * 60;
      }
    });
    
    this.set(this.keys.ALL_DAY_STATS, allDayStats);
  }
  
  /**
   * 迁移到 v1.2.4（目标系统和统一时间单位）
   */
  migrateToV124() {
    logger.log('执行 v1.2.4 迁移 - 修复时间单位');
    
    // 修复 todayStats 的 focusTime 单位为分钟
    const todayStats = this.get(this.keys.TODAY_STATS);
    if (todayStats && todayStats.focusTime) {
      // 如果 focusTime 小于 10，很可能是小时，转换为分钟
      if (todayStats.focusTime < 10) {
        todayStats.focusTime = todayStats.focusTime * 60;
        this.set(this.keys.TODAY_STATS, todayStats);
        logger.log('修复 todayStats 时间单位', todayStats);
      }
    }
    
    // 修复 allDayStats 的 focusTime 单位为分钟
    const allDayStats = this.get(this.keys.ALL_DAY_STATS, {});
    let fixed = false;
    Object.keys(allDayStats).forEach(date => {
      const stats = allDayStats[date];
      if (stats.focusTime && stats.focusTime < 10) {
        stats.focusTime = stats.focusTime * 60;
        fixed = true;
      }
    });
    
    if (fixed) {
      this.set(this.keys.ALL_DAY_STATS, allDayStats);
      logger.log('修复 allDayStats 时间单位');
    }
  }
  
  /**
   * 比较版本号
   * @param {string} v1 - 版本1
   * @param {string} v2 - 版本2
   * @returns {number} -1: v1<v2, 0: v1=v2, 1: v1>v2
   */
  compareVersion(v1, v2) {
    if (!v1) return -1;
    if (!v2) return 1;
    
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    
    return 0;
  }
  
  /**
   * 导出数据（用于备份）
   * @returns {Object} 所有数据
   */
  exportData() {
    try {
      const info = this.getStorageInfo();
      const data = {};
      
      info.keys.forEach(key => {
        data[key] = wx.getStorageSync(key);
      });
      
      return {
        version: this.version,
        exportTime: new Date().toISOString(),
        data: data
      };
    } catch (error) {
      logger.error('导出数据失败', error);
      return null;
    }
  }
  
  /**
   * 导入数据（用于恢复）
   * @param {Object} backup - 备份数据
   * @returns {boolean} 是否成功
   */
  importData(backup) {
    try {
      if (!backup || !backup.data) {
        throw new Error('无效的备份数据');
      }
      
      this.setBatch(backup.data);
      logger.log('数据导入成功', { version: backup.version });
      return true;
    } catch (error) {
      logger.error('导入数据失败', error);
      return false;
    }
  }
}

// 创建单例
const storageManager = new StorageManager();

// 导出
module.exports = storageManager;

