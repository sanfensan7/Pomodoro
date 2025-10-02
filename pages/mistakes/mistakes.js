const MistakeManager = require('../../utils/mistake-manager');
const vibrate = require('../../utils/vibrate');
const app = getApp();

Page({
  data: {
    themeColor: '#ff6b6b',
    mistakes: [],
    filteredMistakes: [],
    subjects: [],
    currentFilter: 'all', // all, subject, mastery, review
    selectedSubject: '',
    selectedMastery: 0,
    searchKeyword: '',
    showFilterMenu: false,
    stats: {},
    loading: false,

    // 热力图数据
    monthlyStats: [],
    calendarDays: [],
    currentStreak: 0,
    maxStreak: 0,
    themeColorRgb: '255, 107, 107'
  },

  onLoad: function() {
    try {
      console.log('错题本页面加载中...');

      // 启用分享功能
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      this.mistakeManager = new MistakeManager();

      // 临时重置数据以测试新的示例数据
      wx.removeStorageSync('mistakes_initialized');

      // 初始化错题本数据（仅在首次使用时）
      this.mistakeManager.initializeIfNeeded();
      this.loadTheme();
      this.loadData();
      this.generateHeatmapData();
      console.log('错题本页面加载完成');
    } catch (error) {
      console.error('错题本页面加载失败:', error);
      // 设置默认数据
      this.setData({
        mistakes: [],
        stats: {
          total: 0,
          needReview: 0,
          mastered: 0
        },
        monthlyStats: [],
        calendarDays: [],
        currentStreak: 0,
        maxStreak: 0,
        heatmapSubtitle: '暂无数据'
      });
    }
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadData();
  },

  loadTheme: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';

    // 将主题色转换为RGB值
    const themeColorRgb = this.hexToRgb(themeColor);

    this.setData({
      themeColor,
      themeColorRgb: themeColorRgb
    });
  },

  // 将十六进制颜色转换为RGB字符串
  hexToRgb: function(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '255, 107, 107'; // 默认值
  },

  loadData: function() {
    this.setData({ loading: true });

    const mistakes = this.mistakeManager.getAllMistakes();
    const subjects = this.mistakeManager.getSubjects();
    const stats = this.mistakeManager.getStats();

    // 为每个错题添加格式化的时间文本
    const mistakesWithTimeText = mistakes.map(mistake => ({
      ...mistake,
      createTimeText: this.formatTime(mistake.createTime)
    }));

    this.setData({
      mistakes: mistakesWithTimeText,
      filteredMistakes: mistakesWithTimeText,
      subjects,
      stats,
      loading: false
    });

    this.generateHeatmapData();
  },

  // 搜索功能
  onSearchInput: function(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterMistakes();
  },

  // 筛选错题
  filterMistakes: function() {
    let filtered = [...this.data.mistakes];
    
    // 关键词搜索
    if (this.data.searchKeyword) {
      filtered = this.mistakeManager.searchMistakes(this.data.searchKeyword);
    }

    // 按筛选条件过滤
    switch (this.data.currentFilter) {
      case 'subject':
        if (this.data.selectedSubject) {
          filtered = filtered.filter(m => m.subject === this.data.selectedSubject);
        }
        break;
      case 'mastery':
        if (this.data.selectedMastery > 0) {
          filtered = filtered.filter(m => m.masteryLevel === this.data.selectedMastery);
        }
        break;
      case 'review':
        const now = new Date().toISOString();
        filtered = filtered.filter(m => m.nextReviewTime <= now);
        break;
      case 'starred':
        filtered = filtered.filter(m => m.isStarred);
        break;
    }

    this.setData({ filteredMistakes: filtered });
  },

  // 显示/隐藏筛选菜单
  toggleFilterMenu: function() {
    this.setData({ showFilterMenu: !this.data.showFilterMenu });
  },

  // 选择筛选类型
  selectFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ 
      currentFilter: filter,
      showFilterMenu: false 
    });
    this.filterMistakes();
  },

  // 选择科目
  selectSubject: function(e) {
    const subject = e.currentTarget.dataset.subject;
    this.setData({ 
      selectedSubject: subject,
      currentFilter: 'subject',
      showFilterMenu: false 
    });
    this.filterMistakes();
  },

  // 选择掌握程度
  selectMastery: function(e) {
    const mastery = parseInt(e.currentTarget.dataset.mastery);
    this.setData({ 
      selectedMastery: mastery,
      currentFilter: 'mastery',
      showFilterMenu: false 
    });
    this.filterMistakes();
  },

  // 清除筛选
  clearFilter: function() {
    this.setData({
      currentFilter: 'all',
      selectedSubject: '',
      selectedMastery: 0,
      searchKeyword: '',
      showFilterMenu: false
    });
    this.filterMistakes();
  },

  // 跳转到错题详情
  viewMistake: function(e) {
    const mistakeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/mistakes/detail?id=${mistakeId}`
    });
  },

  // 跳转到添加错题
  addMistake: function() {
    vibrate.buttonTap();
    wx.navigateTo({
      url: '/pages/mistakes/edit'
    });
  },

  // 编辑错题
  editMistake: function(e) {
    e.stopPropagation();
    const mistakeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/mistakes/edit?id=${mistakeId}`
    });
  },

  // 删除错题
  deleteMistake: function(e) {
    e.stopPropagation();
    const mistakeId = e.currentTarget.dataset.id;
    const self = this;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？删除后无法恢复。',
      success: function(res) {
        if (res.confirm) {
          if (self.mistakeManager.deleteMistake(mistakeId)) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            self.loadData();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 切换收藏状态
  toggleStar: function(e) {
    e.stopPropagation();
    const mistakeId = e.currentTarget.dataset.id;
    const mistake = this.mistakeManager.getMistakeById(mistakeId);
    
    if (mistake) {
      const newStarred = !mistake.isStarred;
      if (this.mistakeManager.updateMistake(mistakeId, { isStarred: newStarred })) {
        wx.showToast({
          title: newStarred ? '已收藏' : '已取消收藏',
          icon: 'success'
        });
        this.loadData();
      }
    }
  },

  // 开始复习
  startReview: function() {
    const reviewMistakes = this.mistakeManager.getMistakesForReview();
    if (reviewMistakes.length === 0) {
      wx.showToast({
        title: '暂无需要复习的错题',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/mistakes/review'
    });
  },

  // 跳转到科目管理
  manageSubjects: function() {
    wx.navigateTo({
      url: '/pages/mistakes/subjects'
    });
  },

  // 跳转到统计页面
  viewStats: function() {
    wx.navigateTo({
      url: '/pages/mistakes/stats'
    });
  },

  // 格式化时间显示
  formatTime: function(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  },

  // 获取掌握程度文字
  getMasteryText: function(level) {
    const texts = ['', '初学', '了解', '熟悉', '掌握', '精通'];
    return texts[level] || '未知';
  },

  // 获取掌握程度颜色
  getMasteryColor: function(level) {
    const colors = ['', '#ff6b6b', '#ffa726', '#ffca28', '#66bb6a', '#4caf50'];
    return colors[level] || '#999';
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // 生成统计图表数据
  generateHeatmapData: function() {
    try {
      const mistakes = this.data.mistakes;

      console.log('开始生成统计数据，错题数量:', mistakes ? mistakes.length : 0);
      if (mistakes && mistakes.length > 0) {
        console.log('错题数据示例:', mistakes[0]);
      }

      // 检查是否有数据
      const hasData = mistakes && mistakes.length > 0;

      if (hasData) {
        // 生成月度统计数据
        const monthlyStats = this.generateMonthlyStats(mistakes);

        // 生成日历数据
        const calendarDays = this.generateCalendarDays(mistakes);

        // 计算学习连击
        const streakData = this.calculateStreak(mistakes);

        console.log('统计数据生成完成:', {
          mistakesCount: mistakes.length,
          monthlyStatsCount: monthlyStats.length,
          calendarDaysCount: calendarDays.length,
          currentStreak: streakData.current,
          maxStreak: streakData.max
        });

        this.setData({
          monthlyStats: monthlyStats,
          calendarDays: calendarDays,
          currentStreak: streakData.current,
          maxStreak: streakData.max
        });
      } else {
        // 没有数据时设置空状态
        console.log('没有错题数据，设置空状态');
        this.setData({
          monthlyStats: [],
          calendarDays: [],
          currentStreak: 0,
          maxStreak: 0
        });
      }

    } catch (error) {
      console.error('生成统计数据失败:', error);
      // 错误时也设置空状态
      this.setData({
        monthlyStats: [],
        calendarDays: [],
        currentStreak: 0,
        maxStreak: 0
      });
    }
  },

  // 生成月度统计数据
  generateMonthlyStats: function(mistakes) {
    const monthlyData = {};
    const today = new Date();

    // 初始化最近6个月的数据
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        added: 0,
        reviewed: 0,
        total: 0,
        label: `${date.getMonth() + 1}月`,
        month: date.getMonth() + 1
      };
    }

    // 统计错题数据
    mistakes.forEach(mistake => {
      // 统计添加的错题
      if (mistake.createTime) {
        const date = new Date(mistake.createTime);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].added++;
          monthlyData[key].total++;
        }
      }

      // 统计复习记录
      if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
        mistake.reviewHistory.forEach(review => {
          const date = new Date(review.date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyData[key]) {
            monthlyData[key].reviewed++;
            monthlyData[key].total++;
          }
        });
      }
    });

    // 转换为数组并计算百分比
    const monthlyArray = Object.values(monthlyData);
    const maxTotal = Math.max(...monthlyArray.map(item => item.total), 1);

    return monthlyArray.map(item => ({
      ...item,
      percentage: (item.total / maxTotal) * 100
    }));
  },

  // 生成日历数据
  generateCalendarDays: function(mistakes) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // 获取本月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 获取本月第一天是星期几
    const firstDayWeek = firstDay.getDay();

    // 获取上个月的最后几天
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();

    const calendarDays = [];
    const dailyStats = {};

    // 统计每日的学习数据
    mistakes.forEach(mistake => {
      if (mistake.createTime) {
        const date = this.formatDate(new Date(mistake.createTime));
        dailyStats[date] = true;
      }
      if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
        mistake.reviewHistory.forEach(review => {
          const date = this.formatDate(new Date(review.date));
          dailyStats[date] = true;
        });
      }
    });

    // 添加上个月的最后几天
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      calendarDays.push({
        day: day,
        date: this.formatDate(date),
        isCurrentMonth: false,
        isToday: false,
        hasData: false
      });
    }

    // 添加本月的所有天
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      const isToday = dateStr === this.formatDate(today);

      calendarDays.push({
        day: day,
        date: dateStr,
        isCurrentMonth: true,
        isToday: isToday,
        hasData: !!dailyStats[dateStr]
      });
    }

    // 添加下个月的前几天，补齐6行
    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push({
        day: day,
        date: this.formatDate(date),
        isCurrentMonth: false,
        isToday: false,
        hasData: false
      });
    }

    return calendarDays;
  },

  // 计算学习连击
  calculateStreak: function(mistakes) {
    if (!mistakes || mistakes.length === 0) {
      return { current: 0, max: 0 };
    }

    const dailyStats = {};

    // 统计每日是否有学习活动
    mistakes.forEach(mistake => {
      if (mistake.createTime) {
        const date = this.formatDate(new Date(mistake.createTime));
        dailyStats[date] = true;
      }
      if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
        mistake.reviewHistory.forEach(review => {
          const date = this.formatDate(new Date(review.date));
          dailyStats[date] = true;
        });
      }
    });

    // 获取所有有学习活动的日期并排序
    const studyDates = Object.keys(dailyStats).sort();

    if (studyDates.length === 0) {
      return { current: 0, max: 0 };
    }

    const today = this.formatDate(new Date());
    let currentStreak = 0;
    let maxStreak = 0;

    // 计算当前连击：从今天开始往前连续的天数
    let checkDate = new Date();
    while (true) {
      const dateStr = this.formatDate(checkDate);
      if (dailyStats[dateStr]) {
        currentStreak++;
        // 往前一天
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  },

  // 日历日期点击事件
  onCalendarDayTap: function(e) {
    const date = e.currentTarget.dataset.date;
    const mistakes = this.data.mistakes;

    // 筛选出该日期的错题
    const dayMistakes = mistakes.filter(mistake => {
      // 检查是否是添加日期
      if (mistake.createTime) {
        const createDate = this.formatDate(new Date(mistake.createTime));
        if (createDate === date) return true;
      }

      // 检查是否是复习日期
      if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
        return mistake.reviewHistory.some(review => {
          const reviewDate = this.formatDate(new Date(review.date));
          return reviewDate === date;
        });
      }

      return false;
    });

    if (dayMistakes.length > 0) {
      wx.showModal({
        title: `${date} 学习记录`,
        content: `这一天共学习了 ${dayMistakes.length} 道题目`,
        showCancel: false,
        confirmText: '查看详情',
        success: (res) => {
          if (res.confirm) {
            // 可以跳转到详情页面或显示更多信息
            console.log('查看详情:', dayMistakes);
          }
        }
      });
    } else {
      wx.showToast({
        title: '这一天没有学习记录',
        icon: 'none'
      });
    }
  },

  // 生成热力图网格数据
  generateHeatmapGrid: function(dailyStats) {
    const gridData = [];
    const today = new Date();

    // 计算最大值用于分级，确保至少为1
    const statsValues = Object.values(dailyStats);
    const maxCount = statsValues.length > 0 ?
      Math.max(...statsValues.map(stats => stats.added + stats.reviewed), 1) : 1;

    // 计算一年前的日期（365天前）
    const oneYearAgo = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000);

    // 找到一年前那一周的周日作为起始日期
    const startWeekday = oneYearAgo.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const startDate = new Date(oneYearAgo.getTime() - startWeekday * 24 * 60 * 60 * 1000);

    // 计算需要多少周来覆盖一年的时间
    const endDate = new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000); // 本周周六
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.ceil(totalDays / 7);

    // 生成热力图数据，按周排列
    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);

        // 只显示一年内的数据
        if (currentDate > today) {
          // 未来的日期显示为空格子
          gridData.push({
            date: this.formatDate(currentDate),
            count: 0,
            level: 0,
            isFuture: true,
            details: {
              added: 0,
              reviewed: 0,
              total: 0
            }
          });
          continue;
        }

        const dateStr = this.formatDate(currentDate);
        const stats = dailyStats[dateStr] || { added: 0, reviewed: 0 };
        const totalCount = stats.added + stats.reviewed;

        // 计算热力等级 (0-4)
        let level = 0;
        if (totalCount > 0) {
          level = Math.min(4, Math.ceil((totalCount / maxCount) * 4));
        }

        // 检查是否是今天
        const isToday = dateStr === this.formatDate(today);

        gridData.push({
          date: dateStr,
          count: totalCount,
          level: level,
          isToday: isToday,
          isFuture: false,
          details: {
            added: stats.added,
            reviewed: stats.reviewed,
            total: totalCount
          }
        });
      }
    }



    // 生成月份标签
    const monthLabels = this.generateMonthLabels(startDate, totalWeeks);

    return {
      gridData: gridData,
      monthLabels: monthLabels,
      totalWeeks: totalWeeks
    };
  },

  // 生成月份标签
  generateMonthLabels: function(startDate, totalWeeks) {
    const monthLabels = [];
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                       '7月', '8月', '9月', '10月', '11月', '12月'];

    let currentMonth = -1;

    for (let week = 0; week < totalWeeks; week++) {
      const weekStartDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const month = weekStartDate.getMonth();

      if (month !== currentMonth) {
        // 新的月份开始
        monthLabels.push({
          week: week,
          month: month,
          label: monthNames[month]
        });
        currentMonth = month;
      } else {
        // 同一个月份，添加空标签
        monthLabels.push({
          week: week,
          month: month,
          label: ''
        });
      }
    }

    return monthLabels;
  },

  // 热力图日期点击事件
  onHeatmapDayTap: function(e) {
    const { date, count, details } = e.currentTarget.dataset;

    if (count > 0 && details) {
      let content = `${date}\n\n`;
      if (details.added > 0) {
        content += `📝 添加错题: ${details.added} 题\n`;
      }
      if (details.reviewed > 0) {
        content += `📖 复习错题: ${details.reviewed} 题\n`;
      }
      content += `\n📊 总计: ${details.total} 题`;

      wx.showModal({
        title: '学习详情',
        content: content,
        showCancel: false
      });
    }
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 关闭筛选菜单
  closeFilterMenu: function() {
    this.setData({ showFilterMenu: false });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // 重置筛选条件
  resetFilters: function() {
    this.setData({
      currentFilter: 'all',
      selectedSubject: '',
      selectedMastery: 0,
      searchKeyword: ''
    });
    this.filterMistakes();
  },

  // 应用筛选条件
  applyFilters: function() {
    this.setData({ showFilterMenu: false });
    this.filterMistakes();
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    const totalMistakes = this.data.mistakes.length;
    const needReview = this.data.stats.reviewStats?.needReview || 0;

    return {
      title: `我的错题本已收录${totalMistakes}道题目，还有${needReview}道待复习`,
      path: '/pages/mistakes/mistakes',
      imageUrl: '',
      desc: '智能错题本，让学习更高效！支持拍照录入、智能复习提醒'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    const totalMistakes = this.data.mistakes.length;

    return {
      title: `我的错题本已收录${totalMistakes}道题目 - 智能学习助手`,
      query: '',
      imageUrl: ''
    };
  }
});
