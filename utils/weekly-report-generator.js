const logger = require('./logger');
const FocusStatsManager = require('./focus-stats-manager');

/**
 * 每周学习报告生成器
 * 生成精美的学习报告，包含统计数据、成就、建议等
 */
class WeeklyReportGenerator {
  constructor() {
    this.STORAGE_KEY_REPORTS = 'weekly_reports';
  }

  /**
   * 生成本周报告
   */
  generateWeeklyReport() {
    try {
      const weekRange = this.getCurrentWeekRange();
      const stats = this.getWeeklyStats(weekRange);
      const achievements = this.getWeeklyAchievements(stats);
      const insights = this.generateInsights(stats);
      const recommendations = this.generateRecommendations(stats);
      
      const report = {
        id: `report_${weekRange.start.replace(/-/g, '')}_${weekRange.end.replace(/-/g, '')}`,
        weekRange,
        stats,
        achievements,
        insights,
        recommendations,
        generatedAt: new Date().toISOString(),
        shareImage: null // 将在生成海报时填充
      };

      // 保存报告
      this.saveReport(report);
      
      logger.log('每周报告生成完成', { reportId: report.id });
      return report;
    } catch (error) {
      logger.error('生成每周报告失败', error);
      throw error;
    }
  }

  /**
   * 获取当前周的日期范围
   */
  getCurrentWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0是周日
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: this.formatDate(monday),
      end: this.formatDate(sunday),
      year: monday.getFullYear(),
      weekNumber: this.getWeekNumber(monday)
    };
  }

  /**
   * 获取周统计数据
   */
  getWeeklyStats(weekRange) {
    const focusRecords = wx.getStorageSync('focusRecords') || [];
    const tasks = wx.getStorageSync('tasks') || [];
    
    // 筛选本周的专注记录
    const weekRecords = focusRecords.filter(record => {
      return record.date >= weekRange.start && record.date <= weekRange.end;
    });

    // 按天分组统计
    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekRange.start);
      date.setDate(date.getDate() + i);
      const dateStr = this.formatDate(date);
      
      const dayRecords = weekRecords.filter(r => r.date === dateStr);
      dailyStats[dateStr] = {
        date: dateStr,
        dayName: this.getDayName(date.getDay()),
        sessions: dayRecords.length,
        minutes: Math.round(dayRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60),
        focusMinutes: Math.round(dayRecords.filter(r => r.type === 'focus').reduce((sum, r) => sum + (r.duration || 0), 0) / 60),
        breakMinutes: Math.round(dayRecords.filter(r => r.type !== 'focus').reduce((sum, r) => sum + (r.duration || 0), 0) / 60)
      };
    }

    // 总体统计
    const totalSessions = weekRecords.length;
    const totalMinutes = Math.round(weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60);
    const focusMinutes = Math.round(weekRecords.filter(r => r.type === 'focus').reduce((sum, r) => sum + (r.duration || 0), 0) / 60);
    const avgDailyMinutes = Math.round(totalMinutes / 7);
    const activeDays = Object.values(dailyStats).filter(d => d.minutes > 0).length;
    
    // 任务完成统计
    const completedTasks = tasks.filter(task => {
      return task.completed && task.completedAt >= weekRange.start && task.completedAt <= weekRange.end;
    }).length;

    // 最佳表现日
    const bestDay = Object.values(dailyStats).reduce((best, day) => {
      return day.minutes > best.minutes ? day : best;
    }, { minutes: 0 });

    return {
      totalSessions,
      totalMinutes,
      focusMinutes,
      avgDailyMinutes,
      activeDays,
      completedTasks,
      dailyStats,
      bestDay,
      consistency: Math.round((activeDays / 7) * 100) // 一致性百分比
    };
  }

  /**
   * 获取周成就
   */
  getWeeklyAchievements(stats) {
    const achievements = [];

    // 专注时长成就
    if (stats.totalMinutes >= 600) {
      achievements.push({
        icon: '🏆',
        title: '专注大师',
        description: `本周专注${stats.totalMinutes}分钟，超过10小时！`
      });
    } else if (stats.totalMinutes >= 300) {
      achievements.push({
        icon: '⭐',
        title: '专注达人',
        description: `本周专注${stats.totalMinutes}分钟，超过5小时！`
      });
    }

    // 连续性成就
    if (stats.consistency >= 85) {
      achievements.push({
        icon: '🔥',
        title: '坚持不懈',
        description: `本周${stats.activeDays}天保持专注，一致性${stats.consistency}%！`
      });
    }

    // 任务完成成就
    if (stats.completedTasks >= 10) {
      achievements.push({
        icon: '✅',
        title: '任务终结者',
        description: `本周完成${stats.completedTasks}个任务，效率超群！`
      });
    }

    // 单日最佳成就
    if (stats.bestDay.minutes >= 120) {
      achievements.push({
        icon: '💪',
        title: '单日之星',
        description: `${stats.bestDay.dayName}专注${stats.bestDay.minutes}分钟，表现出色！`
      });
    }

    return achievements;
  }

  /**
   * 生成学习洞察
   */
  generateInsights(stats) {
    const insights = [];

    // 专注模式分析
    const focusRatio = stats.focusMinutes / stats.totalMinutes;
    if (focusRatio > 0.8) {
      insights.push({
        type: 'positive',
        title: '专注度极佳',
        content: `本周${Math.round(focusRatio * 100)}%的时间用于专注学习，保持了很好的专注状态。`
      });
    } else if (focusRatio < 0.6) {
      insights.push({
        type: 'suggestion',
        title: '专注度有待提升',
        content: `本周专注时间占比${Math.round(focusRatio * 100)}%，建议减少休息时间，提高专注效率。`
      });
    }

    // 学习规律分析
    const dailyValues = Object.values(stats.dailyStats);
    const weekdayMinutes = dailyValues.slice(1, 6).reduce((sum, d) => sum + d.minutes, 0); // 周一到周五
    const weekendMinutes = dailyValues[0].minutes + dailyValues[6].minutes; // 周日和周六
    
    if (weekendMinutes > weekdayMinutes * 0.4) {
      insights.push({
        type: 'positive',
        title: '周末学习积极',
        content: '周末学习时间充足，很好地利用了休息时间进行自我提升。'
      });
    }

    // 一致性分析
    if (stats.consistency >= 70) {
      insights.push({
        type: 'positive',
        title: '学习习惯良好',
        content: `本周${stats.activeDays}天保持学习，养成了良好的学习习惯。`
      });
    } else {
      insights.push({
        type: 'suggestion',
        title: '建议保持规律',
        content: '学习的一致性还有提升空间，建议制定固定的学习时间表。'
      });
    }

    return insights;
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(stats) {
    const recommendations = [];

    // 基于总时长的建议
    if (stats.totalMinutes < 180) {
      recommendations.push({
        icon: '📈',
        title: '增加学习时长',
        content: '建议每天至少专注学习30-45分钟，逐步提升学习强度。'
      });
    }

    // 基于一致性的建议
    if (stats.consistency < 60) {
      recommendations.push({
        icon: '📅',
        title: '建立学习计划',
        content: '制定每日学习计划，设定固定的学习时间，培养学习习惯。'
      });
    }

    // 基于任务完成的建议
    if (stats.completedTasks < 3) {
      recommendations.push({
        icon: '🎯',
        title: '设定明确目标',
        content: '建议设定更多具体的学习任务，让学习更有针对性。'
      });
    }

    // 基于最佳表现的建议
    if (stats.bestDay.minutes > stats.avgDailyMinutes * 2) {
      recommendations.push({
        icon: '⚖️',
        title: '平衡学习强度',
        content: '学习强度波动较大，建议保持更稳定的学习节奏。'
      });
    }

    // 通用建议
    recommendations.push({
      icon: '🌟',
      title: '继续保持',
      content: '学习是一个持续的过程，保持当前的学习热情，持续进步！'
    });

    return recommendations.slice(0, 3); // 最多返回3个建议
  }

  /**
   * 保存报告
   */
  saveReport(report) {
    try {
      const reports = wx.getStorageSync(this.STORAGE_KEY_REPORTS) || [];
      
      // 检查是否已存在相同周的报告
      const existingIndex = reports.findIndex(r => r.id === report.id);
      if (existingIndex >= 0) {
        reports[existingIndex] = report;
      } else {
        reports.push(report);
      }

      // 只保留最近12周的报告
      const sortedReports = reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      const recentReports = sortedReports.slice(0, 12);

      wx.setStorageSync(this.STORAGE_KEY_REPORTS, recentReports);
      logger.log('报告已保存', { reportId: report.id });
    } catch (error) {
      logger.error('保存报告失败', error);
    }
  }

  /**
   * 获取历史报告
   */
  getHistoryReports() {
    try {
      return wx.getStorageSync(this.STORAGE_KEY_REPORTS) || [];
    } catch (error) {
      logger.error('获取历史报告失败', error);
      return [];
    }
  }

  /**
   * 获取指定报告
   */
  getReport(reportId) {
    const reports = this.getHistoryReports();
    return reports.find(r => r.id === reportId);
  }

  // 辅助方法
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  getDayName(dayIndex) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[dayIndex];
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

module.exports = new WeeklyReportGenerator();
