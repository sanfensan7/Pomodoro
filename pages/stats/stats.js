var app = getApp();
var shareHelper = require('../../utils/share-helper');
const logger = require('../../utils/logger');
const perfMonitor = require('../../utils/performance-monitor');
const FocusStatsManager = require('../../utils/focus-stats-manager');
const goalManager = require('../../utils/goal-manager');

Page({
  data: {
    themeColor: '#ff6b6b',
    period: 'day', // 'day', 'week', 'month', 'ranking'
    chartData: {
      labels: [],
      values: [],
      heights: []
    },
    currentStats: {
      count: '0 次',
      duration: '0 小时 0 分钟',
      average: '0 次',
      longest: '0 次'
    },
    
    // 排行榜数据
    myStats: {
      weekMinutes: 0,
      weekHours: 0,
      totalMinutes: 0,
      totalHours: 0,
      consecutiveDays: 0,
      weekSessions: 0,
      rank: 0
    },
    rankingList: [],
    rankingType: 'week', // week, total
    loading: false,
    weeklyData: []
  },

  onLoad: function(options) {
    const tracker = perfMonitor.trackPageLoad('stats');

    try {
      // 启用分享功能
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      // 初始化统计管理器
      this.statsManager = new FocusStatsManager();

      // 获取全局主题色
      if (app.globalData.themeColor) {
        this.setData({
          themeColor: app.globalData.themeColor
        });
      }

      // 如果从其他页面跳转过来并指定了显示排行榜
      if (options && options.tab === 'ranking') {
        this.setData({ period: 'ranking' });
        this.loadRankingData();
      } else {
        // 加载统计数据
        this.fetchStatsData();
      }
      
      tracker.end();
    } catch (error) {
      logger.error('统计页面加载失败:', error);
      tracker.end({ error: true });
    }
  },
  
  onShow: function() {
    // 如果从设置页返回，可能需要更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
    
    // 更新统计数据
    this.fetchStatsData();
  },
  
  getDayStats: function() {
    var todayStats = wx.getStorageSync('todayStats') || { completed: 0, focusTime: 0 };

    // 获取当天24小时的分布数据
    // 这里简化处理，实际应用中可能需要更详细的时间记录
    // 生成8个时间段的标签
    var labels = ['0点', '3点', '6点', '9点', '12点', '15点', '18点', '21点'];

    // 为简化处理，我们将所有专注次数放在当前时间所在的时间段
    var now = new Date();
    var hourIndex = Math.floor(now.getHours() / 3);

    // 创建值数组，将今日专注次数放入对应时间段
    var values = new Array(8).fill(0);
    values[hourIndex] = todayStats.completed;

    // 计算时长的小时和分钟部分
    var hours = Math.floor(todayStats.focusTime);
    var minutes = Math.round((todayStats.focusTime - hours) * 60);
    
    return {
      labels: labels,
      values: values,
      summary: {
        count: todayStats.completed + ' 次',
        duration: hours + ' 小时 ' + minutes + ' 分钟',
        average: (todayStats.completed / 24).toFixed(1) + ' 次/小时',
        longest: todayStats.completed + ' 次' // 简化，实际应该记录连续专注
      }
    };
  },
  
  getWeekStats: function() {
    // 获取本周的统计数据
    var weekStats = wx.getStorageSync('weekStats') || {
      weekStart: new Date().toISOString(),
      completed: 0,
      dailyStats: {}
    };

    // 计算本周的每天日期，从周一到周日
    var weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    var today = new Date();
    var weekStart = new Date(weekStats.weekStart);

    // 初始化各天的值
    var values = new Array(7).fill(0);

    // 填充有数据的天
    for (var dateStr in weekStats.dailyStats) {
      var date = new Date(dateStr);
      // 计算这一天是周几 (0 是周日，1-6 是周一至周六)
      var dayOfWeek = date.getDay();
      // 调整为数组索引 (0-6 代表周一至周日)
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (dayOfWeek >= 0 && dayOfWeek < 7) {
        values[dayOfWeek] = weekStats.dailyStats[dateStr];
      }
    }
    
    // 获取所有日专注时长
    var allDayStats = Object.values(wx.getStorageSync('allDayStats') || {});
    var weekFocusTime = 0;

    // 筛选本周内的日期
    allDayStats.forEach(function(dayStat) {
      var statDate = new Date(dayStat.date);
      if (statDate >= weekStart && statDate <= today) {
        weekFocusTime += dayStat.focusTime;
      }
    });

    // 计算时长的小时和分钟部分
    var hours = Math.floor(weekFocusTime);
    var minutes = Math.round((weekFocusTime - hours) * 60);

    // 计算日均专注次数
    var daysElapsed = Math.min(7, Math.floor((today - weekStart) / (24 * 60 * 60 * 1000)) + 1);
    var avgPerDay = daysElapsed > 0 ? (weekStats.completed / daysElapsed).toFixed(1) : '0.0';

    // 查找最大连续专注次数
    var maxSingleDay = Math.max.apply(Math, values);
    
    return {
      labels: weekDays,
      values: values,
      summary: {
        count: weekStats.completed + ' 次',
        duration: hours + ' 小时 ' + minutes + ' 分钟',
        average: avgPerDay + ' 次/天',
        longest: maxSingleDay + ' 次'
      }
    };
  },
  
  getMonthStats: function() {
    // 获取本月的统计数据
    // 简化处理，按周汇总
    var today = new Date();
    var currentMonth = today.getMonth();
    var currentYear = today.getFullYear();

    // 获取本月第一天
    var firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    // 获取所有日专注统计
    var allDayStats = wx.getStorageSync('allDayStats') || {};

    // 按周分组统计
    var weeklyStats = [0, 0, 0, 0, 0]; // 最多5周
    var totalCompleted = 0;
    var totalFocusTime = 0;

    // 遍历所有日期的统计
    for (var dateStr in allDayStats) {
      var date = new Date(dateStr);

      // 只统计当月的数据
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        // 计算是本月的第几周
        var weekOfMonth = Math.floor((date.getDate() - 1) / 7);
        
        if (weekOfMonth < 5) {
          weeklyStats[weekOfMonth] += allDayStats[dateStr].completed;
          totalCompleted += allDayStats[dateStr].completed;
          totalFocusTime += allDayStats[dateStr].focusTime;
        }
      }
    }
    
    // 生成周标签
    var labels = ['第1周', '第2周', '第3周', '第4周', '第5周'];

    // 计算时长的小时和分钟部分
    var hours = Math.floor(totalFocusTime);
    var minutes = Math.round((totalFocusTime - hours) * 60);

    // 计算本月天数
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var daysElapsed = Math.min(daysInMonth, today.getDate());
    var avgPerDay = daysElapsed > 0 ? (totalCompleted / daysElapsed).toFixed(1) : '0.0';

    // 查找单周最大专注次数
    var maxSingleWeek = Math.max.apply(Math, weeklyStats);
    
    return {
      labels: labels,
      values: weeklyStats,
      summary: {
        count: totalCompleted + ' 次',
        duration: hours + ' 小时 ' + minutes + ' 分钟',
        average: avgPerDay + ' 次/天',
        longest: maxSingleWeek + ' 次/周'
      }
    };
  },
  
  fetchStatsData: function() {
    try {
      let statsData;

      // 根据当前周期获取对应的统计数据
      switch (this.data.period) {
        case 'day':
          statsData = this.getDayStats();
          break;
        case 'week':
          statsData = this.getWeekStats();
          break;
        case 'month':
          statsData = this.getMonthStats();
          break;
        default:
          statsData = this.getDayStats();
      }


      // 确保数据完整性
      if (!statsData || !statsData.labels || !statsData.values || !statsData.summary) {
        console.error('统计数据不完整:', statsData);
        statsData = {
          labels: ['暂无数据'],
          values: [0],
          summary: {
            count: '0 次',
            duration: '0 小时 0 分钟',
            average: '0 次',
            longest: '0 次'
          }
        };
      }

      // 更新图表和统计摘要
      this.setData({
        chartData: {
          labels: statsData.labels,
          values: statsData.values,
          heights: this.calculateHeights(statsData.values)
        },
        currentStats: statsData.summary
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 设置默认数据
      this.setData({
        chartData: {
          labels: ['暂无数据'],
          values: [0],
          heights: [0]
        },
        currentStats: {
          count: '0 次',
          duration: '0 小时 0 分钟',
          average: '0 次',
          longest: '0 次'
        }
      });
    }
  },
  
  calculateHeights: function(values) {
    // 计算柱状图高度，最大值对应300rpx高度
    var maxValue = Math.max(Math.max.apply(Math, values), 1); // 至少为1，避免除以0
    return values.map(function(value) { return (value / maxValue) * 300; });
  },
  
  switchPeriod: function(e) {
    var period = e.currentTarget.dataset.period;

    this.setData({ period });
    
    if (period === 'ranking') {
      this.loadRankingData();
    } else {
      this.fetchStatsData();
    }
  },
  
  /**
   * 加载排行榜相关数据
   */
  loadRankingData: function() {
    try {
      logger.log('加载排行榜数据');
      
      // 加载我的统计数据
      this.loadMyStats();
      
      // 加载排行榜列表
      this.loadRankingList();
    } catch (error) {
      logger.error('加载排行榜数据失败', error);
    }
  },
  
  /**
   * 加载我的统计数据
   */
  loadMyStats: function() {
    try {
      if (!this.statsManager) {
        this.statsManager = new FocusStatsManager();
      }
      
      const stats = this.statsManager.getStats();
      const weeklyData = this.statsManager.getWeeklyData();
      
      this.setData({
        myStats: {
          weekMinutes: stats.weekMinutes,
          weekHours: stats.weekHours,
          totalMinutes: stats.totalMinutes,
          totalHours: stats.totalHours,
          consecutiveDays: stats.consecutiveDays,
          weekSessions: stats.weekSessions,
          rank: 0 // 将在加载排行榜后更新
        },
        weeklyData: weeklyData
      });
      
      logger.log('我的数据加载完成', stats);
    } catch (error) {
      logger.error('加载我的数据失败', error);
    }
  },
  
  /**
   * 加载排行榜列表
   */
  loadRankingList: function() {
    this.setData({ loading: true });
    
    try {
      // 方式1: 使用云开发获取好友排行（需要配置）
      // this.loadCloudRanking();
      
      // 方式2: 使用模拟数据（开发测试用）
      this.loadMockRanking();
      
    } catch (error) {
      logger.error('加载排行榜失败', error);
      this.setData({ loading: false });
    }
  },
  
  /**
   * 加载模拟排行数据（开发测试用）
   */
  loadMockRanking: function() {
    // 生成默认头像（使用颜色背景 + emoji）
    const defaultAvatars = [
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23FF6B6B" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white"%3E🥇%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%234ECDC4" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white"%3E⭐%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23FFD93D" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white"%3E🐝%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%239B59B6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white"%3E🍅%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%2395A5A6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white"%3E👤%3C/text%3E%3C/svg%3E'
    ];
    
    const mockData = [
      {
        rank: 1,
        nickname: '专注达人',
        avatarUrl: defaultAvatars[0],
        weekMinutes: 1200,
        weekHours: 20,
        totalMinutes: 5000,
        totalHours: 83.3
      },
      {
        rank: 2,
        nickname: '学习之星',
        avatarUrl: defaultAvatars[1],
        weekMinutes: 1050,
        weekHours: 17.5,
        totalMinutes: 4500,
        totalHours: 75
      },
      {
        rank: 3,
        nickname: '努力小蜜蜂',
        avatarUrl: defaultAvatars[2],
        weekMinutes: 900,
        weekHours: 15,
        totalMinutes: 3800,
        totalHours: 63.3
      },
      {
        rank: 4,
        nickname: '番茄爱好者',
        avatarUrl: defaultAvatars[3],
        weekMinutes: 750,
        weekHours: 12.5,
        totalMinutes: 3200,
        totalHours: 53.3
      },
      {
        rank: 5,
        nickname: '你',
        avatarUrl: defaultAvatars[4],
        weekMinutes: this.data.myStats.weekMinutes,
        weekHours: this.data.myStats.weekHours,
        totalMinutes: this.data.myStats.totalMinutes,
        totalHours: this.data.myStats.totalHours,
        isMe: true
      }
    ];
    
    setTimeout(() => {
      this.setData({
        rankingList: mockData,
        'myStats.rank': 5,
        loading: false
      });
      
      logger.log('模拟排行榜数据加载完成');
    }, 500);
  },
  
  /**
   * 切换排行榜类型
   */
  switchRankingType: function(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === this.data.rankingType) return;
    
    logger.log('切换排行榜类型', { type });
    
    this.setData({
      rankingType: type
    });
    
    this.loadRankingList();
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return shareHelper.getShareAppMessageConfig('total', '/pages/stats/stats');
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  },


});