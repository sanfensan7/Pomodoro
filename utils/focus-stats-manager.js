/**
 * 专注统计管理器
 * 用于统计总专注时长、每周专注时长等
 */

const logger = require('./logger');

class FocusStatsManager {
  constructor() {
    this.storageKey = 'focusHistory';
    this.statsKey = 'focusStats';
  }
  
  /**
   * 记录一次专注完成
   * @param {number} duration - 专注时长（分钟）
   * @param {string} taskId - 关联的任务ID（可选）
   */
  recordFocusSession(duration, taskId = null) {
    try {
      const session = {
        id: this.generateId(),
        duration: duration, // 分钟
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + duration * 60000).toISOString(),
        taskId: taskId,
        date: new Date().toDateString()
      };
      
      const history = this.getFocusHistory();
      history.push(session);
      
      wx.setStorageSync(this.storageKey, history);
      
      // 更新统计数据
      this.updateStats();
      
      logger.log('记录专注完成', { duration, taskId });
      return session;
    } catch (error) {
      logger.error('记录专注失败', error);
      return null;
    }
  }
  
  /**
   * 获取专注历史记录
   */
  getFocusHistory() {
    try {
      return wx.getStorageSync(this.storageKey) || [];
    } catch (error) {
      logger.error('获取专注历史失败', error);
      return [];
    }
  }
  
  /**
   * 更新统计数据
   */
  updateStats() {
    try {
      const history = this.getFocusHistory();
      const now = new Date();
      
      const stats = {
        // 总统计
        totalSessions: history.length,
        totalMinutes: this.calculateTotalMinutes(history),
        totalHours: this.calculateTotalHours(history),
        
        // 今日统计
        todaySessions: this.getTodaySessions(history).length,
        todayMinutes: this.calculateTotalMinutes(this.getTodaySessions(history)),
        
        // 本周统计
        weekSessions: this.getWeekSessions(history).length,
        weekMinutes: this.calculateTotalMinutes(this.getWeekSessions(history)),
        weekHours: this.calculateTotalHours(this.getWeekSessions(history)),
        
        // 本月统计
        monthSessions: this.getMonthSessions(history).length,
        monthMinutes: this.calculateTotalMinutes(this.getMonthSessions(history)),
        monthHours: this.calculateTotalHours(this.getMonthSessions(history)),
        
        // 平均数据
        avgSessionDuration: this.calculateAvgDuration(history),
        avgDailyMinutes: this.calculateAvgDailyMinutes(history),
        
        // 连续专注天数
        consecutiveDays: this.calculateConsecutiveDays(history),
        
        // 最后更新时间
        lastUpdate: now.toISOString()
      };
      
      wx.setStorageSync(this.statsKey, stats);
      
      logger.log('统计数据已更新', stats);
      return stats;
    } catch (error) {
      logger.error('更新统计数据失败', error);
      return null;
    }
  }
  
  /**
   * 获取统计数据
   */
  getStats() {
    try {
      let stats = wx.getStorageSync(this.statsKey);
      
      // 如果没有统计数据，生成一次
      if (!stats) {
        stats = this.updateStats();
      }
      
      return stats || this.getDefaultStats();
    } catch (error) {
      logger.error('获取统计数据失败', error);
      return this.getDefaultStats();
    }
  }
  
  /**
   * 获取默认统计数据
   */
  getDefaultStats() {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalHours: 0,
      todaySessions: 0,
      todayMinutes: 0,
      weekSessions: 0,
      weekMinutes: 0,
      weekHours: 0,
      monthSessions: 0,
      monthMinutes: 0,
      monthHours: 0,
      avgSessionDuration: 0,
      avgDailyMinutes: 0,
      consecutiveDays: 0,
      lastUpdate: new Date().toISOString()
    };
  }
  
  /**
   * 获取今日专注记录
   */
  getTodaySessions(history = null) {
    const sessions = history || this.getFocusHistory();
    const today = new Date().toDateString();
    return sessions.filter(s => new Date(s.startTime).toDateString() === today);
  }
  
  /**
   * 获取本周专注记录
   */
  getWeekSessions(history = null) {
    const sessions = history || this.getFocusHistory();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    
    return sessions.filter(s => new Date(s.startTime) >= weekStart);
  }
  
  /**
   * 获取本月专注记录
   */
  getMonthSessions(history = null) {
    const sessions = history || this.getFocusHistory();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return sessions.filter(s => new Date(s.startTime) >= monthStart);
  }
  
  /**
   * 计算总分钟数
   */
  calculateTotalMinutes(sessions) {
    return sessions.reduce((total, s) => total + s.duration, 0);
  }
  
  /**
   * 计算总小时数
   */
  calculateTotalHours(sessions) {
    const minutes = this.calculateTotalMinutes(sessions);
    return Math.round(minutes / 60 * 10) / 10; // 保留1位小数
  }
  
  /**
   * 计算平均每次专注时长
   */
  calculateAvgDuration(sessions) {
    if (sessions.length === 0) return 0;
    return Math.round(this.calculateTotalMinutes(sessions) / sessions.length);
  }
  
  /**
   * 计算平均每天专注时长
   */
  calculateAvgDailyMinutes(sessions) {
    if (sessions.length === 0) return 0;
    
    // 统计每天的专注时长
    const dailyMinutes = {};
    sessions.forEach(s => {
      const date = new Date(s.startTime).toDateString();
      dailyMinutes[date] = (dailyMinutes[date] || 0) + s.duration;
    });
    
    const days = Object.keys(dailyMinutes).length;
    const totalMinutes = Object.values(dailyMinutes).reduce((a, b) => a + b, 0);
    
    return Math.round(totalMinutes / days);
  }
  
  /**
   * 计算连续专注天数
   */
  calculateConsecutiveDays(sessions) {
    if (sessions.length === 0) return 0;
    
    // 获取所有专注的日期（去重）
    const dates = [...new Set(sessions.map(s => new Date(s.startTime).toDateString()))];
    dates.sort((a, b) => new Date(b) - new Date(a)); // 降序排列
    
    let consecutive = 0;
    const today = new Date().toDateString();
    let checkDate = new Date();
    
    for (const dateStr of dates) {
      const sessionDate = new Date(dateStr);
      const expectedDate = new Date(checkDate);
      expectedDate.setHours(0, 0, 0, 0);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        consecutive++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return consecutive;
  }
  
  /**
   * 获取每周每天的专注数据
   */
  getWeeklyData() {
    const weekSessions = this.getWeekSessions();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    
    const weekData = [];
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toDateString();
      
      const daySessions = weekSessions.filter(s => 
        new Date(s.startTime).toDateString() === dateStr
      );
      
      weekData.push({
        day: dayNames[i],
        date: dateStr,
        sessions: daySessions.length,
        minutes: this.calculateTotalMinutes(daySessions),
        hours: this.calculateTotalHours(daySessions)
      });
    }
    
    return weekData;
  }
  
  /**
   * 获取排行榜数据（用于上传到云开发）
   */
  getRankingData() {
    const stats = this.getStats();
    
    return {
      weekMinutes: stats.weekMinutes,
      weekHours: stats.weekHours,
      weekSessions: stats.weekSessions,
      totalMinutes: stats.totalMinutes,
      totalHours: stats.totalHours,
      consecutiveDays: stats.consecutiveDays,
      updateTime: new Date().toISOString()
    };
  }
  
  /**
   * 格式化时长显示
   * @param {number} minutes - 分钟数
   * @returns {string} 格式化后的字符串
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  }
  
  /**
   * 生成唯一ID
   */
  generateId() {
    return 'fs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * 清除所有数据（慎用）
   */
  clearAllData() {
    try {
      wx.removeStorageSync(this.storageKey);
      wx.removeStorageSync(this.statsKey);
      logger.warn('专注统计数据已清除');
      return true;
    } catch (error) {
      logger.error('清除数据失败', error);
      return false;
    }
  }
}

module.exports = FocusStatsManager;

