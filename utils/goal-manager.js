const logger = require('./logger');

/**
 * 目标管理器
 * 支持每日目标和每周目标设定
 */
class GoalManager {
  constructor() {
    this.STORAGE_KEY_GOALS = 'user_goals';
    this.STORAGE_KEY_GOAL_HISTORY = 'goal_history';
    this.DEFAULT_GOALS = {
      daily: {
        enabled: true,
        target: 120, // 分钟
        type: 'daily'
      },
      weekly: {
        enabled: true,
        target: 600, // 分钟
        type: 'weekly'
      }
    };
  }

  /**
   * 获取目标设置
   */
  getGoals() {
    try {
      const goals = wx.getStorageSync(this.STORAGE_KEY_GOALS);
      return goals || this.DEFAULT_GOALS;
    } catch (error) {
      logger.error('获取目标设置失败', error);
      return this.DEFAULT_GOALS;
    }
  }

  /**
   * 保存目标设置
   */
  saveGoals(goals) {
    try {
      wx.setStorageSync(this.STORAGE_KEY_GOALS, goals);
      logger.log('目标设置已保存', goals);
      return true;
    } catch (error) {
      logger.error('保存目标设置失败', error);
      return false;
    }
  }

  /**
   * 更新每日目标
   */
  updateDailyGoal(target, enabled = true) {
    const goals = this.getGoals();
    goals.daily = {
      enabled,
      target,
      type: 'daily'
    };
    return this.saveGoals(goals);
  }

  /**
   * 更新每周目标
   */
  updateWeeklyGoal(target, enabled = true) {
    const goals = this.getGoals();
    goals.weekly = {
      enabled,
      target,
      type: 'weekly'
    };
    return this.saveGoals(goals);
  }

  /**
   * 获取目标进度
   * @param {Object} stats - 来自 FocusStatsManager 的统计数据
   */
  getProgress(stats) {
    const goals = this.getGoals();
    
    return {
      daily: {
        enabled: goals.daily.enabled,
        target: goals.daily.target,
        current: stats.todayMinutes || 0,
        percentage: goals.daily.enabled 
          ? Math.min(100, Math.round((stats.todayMinutes / goals.daily.target) * 100))
          : 0,
        achieved: goals.daily.enabled && stats.todayMinutes >= goals.daily.target,
        remaining: Math.max(0, goals.daily.target - stats.todayMinutes)
      },
      weekly: {
        enabled: goals.weekly.enabled,
        target: goals.weekly.target,
        current: stats.weekMinutes || 0,
        percentage: goals.weekly.enabled
          ? Math.min(100, Math.round((stats.weekMinutes / goals.weekly.target) * 100))
          : 0,
        achieved: goals.weekly.enabled && stats.weekMinutes >= goals.weekly.target,
        remaining: Math.max(0, goals.weekly.target - stats.weekMinutes)
      }
    };
  }

  /**
   * 检查是否达成目标（用于触发庆祝动画）
   * @param {number} previousMinutes - 之前的分钟数
   * @param {number} currentMinutes - 当前分钟数
   * @param {number} target - 目标分钟数
   * @returns {boolean} 是否刚刚达成目标
   */
  checkGoalAchieved(previousMinutes, currentMinutes, target) {
    return previousMinutes < target && currentMinutes >= target;
  }

  /**
   * 记录目标完成历史
   */
  recordGoalCompletion(type, date, target, actual) {
    try {
      const history = wx.getStorageSync(this.STORAGE_KEY_GOAL_HISTORY) || [];
      history.push({
        type,
        date,
        target,
        actual,
        achieved: actual >= target,
        timestamp: Date.now()
      });
      
      // 只保留最近90天的记录
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter(record => record.timestamp > ninetyDaysAgo);
      
      wx.setStorageSync(this.STORAGE_KEY_GOAL_HISTORY, filteredHistory);
      logger.log('目标完成记录已保存', { type, date, achieved: actual >= target });
    } catch (error) {
      logger.error('记录目标完成历史失败', error);
    }
  }

  /**
   * 获取目标完成率统计
   */
  getCompletionStats() {
    try {
      const history = wx.getStorageSync(this.STORAGE_KEY_GOAL_HISTORY) || [];
      
      // 最近7天
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const last7Days = history.filter(r => r.timestamp > sevenDaysAgo && r.type === 'daily');
      
      // 最近30天
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const last30Days = history.filter(r => r.timestamp > thirtyDaysAgo && r.type === 'daily');
      
      // 所有周目标
      const weeklyHistory = history.filter(r => r.type === 'weekly');
      const recentWeeks = weeklyHistory.slice(-12); // 最近12周
      
      return {
        daily: {
          last7Days: {
            total: last7Days.length,
            achieved: last7Days.filter(r => r.achieved).length,
            rate: last7Days.length > 0 
              ? Math.round((last7Days.filter(r => r.achieved).length / last7Days.length) * 100)
              : 0
          },
          last30Days: {
            total: last30Days.length,
            achieved: last30Days.filter(r => r.achieved).length,
            rate: last30Days.length > 0
              ? Math.round((last30Days.filter(r => r.achieved).length / last30Days.length) * 100)
              : 0
          }
        },
        weekly: {
          recent12Weeks: {
            total: recentWeeks.length,
            achieved: recentWeeks.filter(r => r.achieved).length,
            rate: recentWeeks.length > 0
              ? Math.round((recentWeeks.filter(r => r.achieved).length / recentWeeks.length) * 100)
              : 0
          }
        },
        currentStreak: this.calculateStreak(history)
      };
    } catch (error) {
      logger.error('获取目标完成率统计失败', error);
      return {
        daily: { last7Days: { total: 0, achieved: 0, rate: 0 }, last30Days: { total: 0, achieved: 0, rate: 0 } },
        weekly: { recent12Weeks: { total: 0, achieved: 0, rate: 0 } },
        currentStreak: 0
      };
    }
  }

  /**
   * 计算连续达成天数
   */
  calculateStreak(history) {
    const dailyRecords = history
      .filter(r => r.type === 'daily' && r.achieved)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (dailyRecords.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const record of dailyRecords) {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

module.exports = new GoalManager();


