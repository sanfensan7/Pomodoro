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
    heatmapData: [],
    heatmapGridData: [],
    heatmapSubtitle: ''
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
        heatmapData: [],
        heatmapGridData: this.generateHeatmapGrid({}),
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
    this.setData({ themeColor });
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

  // 生成热力图数据
  generateHeatmapData: function() {
    try {
      const mistakes = this.data.mistakes;

      const dailyStats = {};



      // 统计每日添加和复习的错题数量
      mistakes.forEach(mistake => {
        // 统计添加日期
        if (mistake.createTime) {
          const addDate = this.formatDate(new Date(mistake.createTime));
          if (!dailyStats[addDate]) {
            dailyStats[addDate] = { added: 0, reviewed: 0 };
          }
          dailyStats[addDate].added++;
        }

        // 统计复习记录
        if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
          mistake.reviewHistory.forEach(review => {
            const reviewDate = this.formatDate(new Date(review.date));
            if (!dailyStats[reviewDate]) {
              dailyStats[reviewDate] = { added: 0, reviewed: 0 };
            }
            dailyStats[reviewDate].reviewed++;
          });
        }
      });

      // 转换为热力图数据格式
      const heatmapData = Object.keys(dailyStats).map(date => {
        const stats = dailyStats[date];
        const totalCount = stats.added + stats.reviewed;

        return {
          date: date,
          count: totalCount,
          details: {
            added: stats.added,
            reviewed: stats.reviewed,
            total: totalCount
          }
        };
      });

      // 计算统计信息
      const totalAdded = Object.values(dailyStats).reduce((sum, day) => sum + day.added, 0);
      const totalReviewed = Object.values(dailyStats).reduce((sum, day) => sum + day.reviewed, 0);
      const activeDays = Object.keys(dailyStats).length;

      let subtitle = '';
      if (activeDays > 0) {
        subtitle = `最近一年共学习 ${activeDays} 天，添加 ${totalAdded} 题，复习 ${totalReviewed} 题`;
      } else {
        subtitle = '暂无学习记录，开始添加错题来生成热力图吧';
      }

      // 生成网格数据（最近一年，每天一个格子）
      const gridData = this.generateHeatmapGrid(dailyStats);


      console.log('热力图数据生成完成:', {
        heatmapDataLength: heatmapData.length,
        gridDataLength: gridData.length,
        subtitle: subtitle
      });

      this.setData({
        heatmapData,
        heatmapGridData: gridData,
        heatmapSubtitle: subtitle
      });

    } catch (error) {
      console.error('生成热力图数据失败:', error);
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

    // 找到今天是星期几，调整起始日期让网格对齐
    const todayWeekday = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const startDate = new Date(today.getTime() - (52 * 7 + todayWeekday) * 24 * 60 * 60 * 1000);

    // 生成53周 × 7天 = 371天的数据
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
        const dateStr = this.formatDate(currentDate);
        const stats = dailyStats[dateStr] || { added: 0, reviewed: 0 };
        const totalCount = stats.added + stats.reviewed;

        // 计算热力等级 (0-4)
        let level = 0;
        if (totalCount > 0) {
          level = Math.min(4, Math.ceil((totalCount / maxCount) * 4));
        }

        gridData.push({
          date: dateStr,
          count: totalCount,
          level: level,
          details: {
            added: stats.added,
            reviewed: stats.reviewed,
            total: totalCount
          }
        });
      }
    }

    console.log('生成热力图网格数据:', gridData.length, '个格子');
    return gridData;
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
