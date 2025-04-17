const app = getApp();

Page({
  data: {
    themeColor: '#ff6b6b',
    period: 'day', // 'day', 'week', 'month'
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
    }
  },

  onLoad: function() {
    // 获取全局主题色
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
    
    // 加载统计数据
    this.fetchStatsData();
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
    const todayStats = wx.getStorageSync('todayStats') || { completed: 0, focusTime: 0 };
    
    // 获取当天24小时的分布数据
    // 这里简化处理，实际应用中可能需要更详细的时间记录
    // 生成8个时间段的标签
    const labels = ['0点', '3点', '6点', '9点', '12点', '15点', '18点', '21点'];
    
    // 为简化处理，我们将所有专注次数放在当前时间所在的时间段
    const now = new Date();
    const hourIndex = Math.floor(now.getHours() / 3);
    
    // 创建值数组，将今日专注次数放入对应时间段
    const values = new Array(8).fill(0);
    values[hourIndex] = todayStats.completed;
    
    // 计算时长的小时和分钟部分
    const hours = Math.floor(todayStats.focusTime);
    const minutes = Math.round((todayStats.focusTime - hours) * 60);
    
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
    const weekStats = wx.getStorageSync('weekStats') || { 
      weekStart: new Date().toISOString(),
      completed: 0,
      dailyStats: {}
    };
    
    // 计算本周的每天日期，从周一到周日
    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const weekStart = new Date(weekStats.weekStart);
    
    // 初始化各天的值
    const values = new Array(7).fill(0);
    
    // 填充有数据的天
    for (const dateStr in weekStats.dailyStats) {
      const date = new Date(dateStr);
      // 计算这一天是周几 (0 是周日，1-6 是周一至周六)
      let dayOfWeek = date.getDay();
      // 调整为数组索引 (0-6 代表周一至周日)
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (dayOfWeek >= 0 && dayOfWeek < 7) {
        values[dayOfWeek] = weekStats.dailyStats[dateStr];
      }
    }
    
    // 获取所有日专注时长
    const allDayStats = Object.values(wx.getStorageSync('allDayStats') || {});
    let weekFocusTime = 0;
    
    // 筛选本周内的日期
    allDayStats.forEach(dayStat => {
      const statDate = new Date(dayStat.date);
      if (statDate >= weekStart && statDate <= today) {
        weekFocusTime += dayStat.focusTime;
      }
    });
    
    // 计算时长的小时和分钟部分
    const hours = Math.floor(weekFocusTime);
    const minutes = Math.round((weekFocusTime - hours) * 60);
    
    // 计算日均专注次数
    const daysElapsed = Math.min(7, Math.floor((today - weekStart) / (24 * 60 * 60 * 1000)) + 1);
    const avgPerDay = daysElapsed > 0 ? (weekStats.completed / daysElapsed).toFixed(1) : '0.0';
    
    // 查找最大连续专注次数
    const maxSingleDay = Math.max(...values);
    
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
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 获取本月第一天
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // 获取所有日专注统计
    const allDayStats = wx.getStorageSync('allDayStats') || {};
    
    // 按周分组统计
    const weeklyStats = [0, 0, 0, 0, 0]; // 最多5周
    let totalCompleted = 0;
    let totalFocusTime = 0;
    
    // 遍历所有日期的统计
    for (const dateStr in allDayStats) {
      const date = new Date(dateStr);
      
      // 只统计当月的数据
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        // 计算是本月的第几周
        const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
        
        if (weekOfMonth < 5) {
          weeklyStats[weekOfMonth] += allDayStats[dateStr].completed;
          totalCompleted += allDayStats[dateStr].completed;
          totalFocusTime += allDayStats[dateStr].focusTime;
        }
      }
    }
    
    // 生成周标签
    const labels = ['第1周', '第2周', '第3周', '第4周', '第5周'];
    
    // 计算时长的小时和分钟部分
    const hours = Math.floor(totalFocusTime);
    const minutes = Math.round((totalFocusTime - hours) * 60);
    
    // 计算本月天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysElapsed = Math.min(daysInMonth, today.getDate());
    const avgPerDay = daysElapsed > 0 ? (totalCompleted / daysElapsed).toFixed(1) : '0.0';
    
    // 查找单周最大专注次数
    const maxSingleWeek = Math.max(...weeklyStats);
    
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
  },
  
  calculateHeights: function(values) {
    // 计算柱状图高度，最大值对应300rpx高度
    const maxValue = Math.max(...values, 1); // 至少为1，避免除以0
    return values.map(value => (value / maxValue) * 300);
  },
  
  switchPeriod: function(e) {
    const period = e.currentTarget.dataset.period;
    
    this.setData({ period });
    this.fetchStatsData();
  }
}); 