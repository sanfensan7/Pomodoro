const FocusStatsManager = require('../../utils/focus-stats-manager');
const logger = require('../../utils/logger');
const vibrate = require('../../utils/vibrate');

Page({
  data: {
    themeColor: '#ff6b6b',
    currentYear: 2025,
    currentMonth: 10, // 10月
    
    // 日历数据
    calendar: [],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    
    // 热力图数据
    heatmapData: [],
    maxMinutes: 0,
    
    // 选中的日期
    selectedDate: null,
    selectedDateStats: null,
    
    // 统计信息
    monthStats: {
      totalDays: 0,
      focusDays: 0,
      totalMinutes: 0,
      avgMinutes: 0
    }
  },

  onLoad: function() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    
    this.loadCalendarData();
  },

  onShow: function() {
    const app = getApp();
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
  },

  /**
   * 加载日历数据
   */
  loadCalendarData: function() {
    const { currentYear, currentMonth } = this.data;
    
    // 生成日历格子
    const calendar = this.generateCalendar(currentYear, currentMonth);
    
    // 获取热力图数据
    const heatmapData = this.getHeatmapData(currentYear, currentMonth);
    
    // 计算最大分钟数（用于热力图颜色梯度）
    const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 0);
    
    // 计算月统计
    const monthStats = this.calculateMonthStats(heatmapData);
    
    this.setData({
      calendar,
      heatmapData,
      maxMinutes,
      monthStats
    });
    
    logger.log('日历数据已加载', { year: currentYear, month: currentMonth, maxMinutes });
  },

  /**
   * 生成日历格子数据
   */
  generateCalendar: function(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0-6, 0是周日
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    
    // 填充上个月的日期（占位）
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendar.push({ day: '', isEmpty: true });
    }
    
    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = this.isToday(year, month, day);
      
      calendar.push({
        day,
        dateStr,
        isToday,
        isEmpty: false
      });
    }
    
    return calendar;
  },

  /**
   * 检查是否是今天
   */
  isToday: function(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() + 1 && 
           day === today.getDate();
  },

  /**
   * 获取热力图数据
   */
  getHeatmapData: function(year, month) {
    const focusRecords = wx.getStorageSync('focusRecords') || [];
    const heatmapData = [];
    
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 筛选当天的专注记录
      const dayRecords = focusRecords.filter(record => {
        return record.date && record.date.startsWith(dateStr);
      });
      
      // 计算当天总分钟数
      const totalMinutes = dayRecords.reduce((sum, record) => {
        return sum + (record.duration || 0);
      }, 0);
      
      heatmapData.push({
        date: dateStr,
        minutes: Math.round(totalMinutes / 60), // 转换为分钟
        count: dayRecords.length
      });
    }
    
    return heatmapData;
  },

  /**
   * 计算月统计
   */
  calculateMonthStats: function(heatmapData) {
    const focusDays = heatmapData.filter(d => d.minutes > 0).length;
    const totalMinutes = heatmapData.reduce((sum, d) => sum + d.minutes, 0);
    const avgMinutes = focusDays > 0 ? Math.round(totalMinutes / focusDays) : 0;
    
    return {
      totalDays: heatmapData.length,
      focusDays,
      totalMinutes,
      avgMinutes
    };
  },

  /**
   * 获取热力图颜色
   */
  getHeatmapColor: function(minutes, maxMinutes) {
    if (minutes === 0) return '#f0f0f0';
    
    const ratio = minutes / maxMinutes;
    
    if (ratio < 0.25) return '#ffcdd2'; // 淡红
    if (ratio < 0.5) return '#ef9a9a'; // 中淡红
    if (ratio < 0.75) return '#e57373'; // 中红
    return '#f44336'; // 深红
  },

  /**
   * 点击日期
   */
  onDateTap: function(e) {
    const { dateStr } = e.currentTarget.dataset;
    if (!dateStr) return;
    
    vibrate.buttonTap();
    
    // 查找该日期的统计数据
    const dateData = this.data.heatmapData.find(d => d.date === dateStr);
    
    this.setData({
      selectedDate: dateStr,
      selectedDateStats: dateData || { date: dateStr, minutes: 0, count: 0 }
    });
  },

  /**
   * 关闭日期详情
   */
  closeDateDetail: function() {
    this.setData({
      selectedDate: null,
      selectedDateStats: null
    });
  },

  /**
   * 切换到上个月
   */
  prevMonth: function() {
    vibrate.buttonTap();
    
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    
    this.setData({
      currentYear,
      currentMonth
    });
    
    this.loadCalendarData();
  },

  /**
   * 切换到下个月
   */
  nextMonth: function() {
    vibrate.buttonTap();
    
    let { currentYear, currentMonth } = this.data;
    const now = new Date();
    const currentYearNow = now.getFullYear();
    const currentMonthNow = now.getMonth() + 1;
    
    // 不能超过当前月份
    if (currentYear === currentYearNow && currentMonth === currentMonthNow) {
      wx.showToast({
        title: '已是当前月份',
        icon: 'none'
      });
      return;
    }
    
    currentMonth++;
    
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    
    this.setData({
      currentYear,
      currentMonth
    });
    
    this.loadCalendarData();
  },

  /**
   * 跳转到今天
   */
  goToToday: function() {
    vibrate.buttonTap();
    
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    
    this.loadCalendarData();
  }
});


