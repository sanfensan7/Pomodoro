Page({
  data: {
    themeColor: '#ff6b6b',
    userLevel: 1,
    currentExp: 0,
    nextLevelExp: 100,
    totalFocusTime: 0,
    totalSessions: 0,
    currentStreak: 0,
    maxStreak: 0,
    achievements: [
      {
        id: 'first_focus',
        title: '初次专注',
        description: '完成第一次专注',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'sessions'
      },
      {
        id: 'focus_master',
        title: '专注大师',
        description: '累计专注100次',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        target: 100,
        type: 'sessions'
      },
      {
        id: 'time_keeper',
        title: '时间守护者',
        description: '累计专注25小时',
        icon: '⏰',
        unlocked: false,
        progress: 0,
        target: 1500, // 25小时 = 1500分钟
        type: 'time'
      },
      {
        id: 'streak_warrior',
        title: '连击战士',
        description: '连续专注7天',
        icon: '🔥',
        unlocked: false,
        progress: 0,
        target: 7,
        type: 'streak'
      },
      {
        id: 'early_bird',
        title: '早起鸟儿',
        description: '在早上6-8点完成专注',
        icon: '🌅',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'special'
      },
      {
        id: 'night_owl',
        title: '夜猫子',
        description: '在晚上10-12点完成专注',
        icon: '🦉',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'special'
      },
      {
        id: 'perfectionist',
        title: '完美主义者',
        description: '连续10次专注不中断',
        icon: '💎',
        unlocked: false,
        progress: 0,
        target: 10,
        type: 'perfect'
      },
      {
        id: 'task_master',
        title: '任务大师',
        description: '完成50个任务',
        icon: '📋',
        unlocked: false,
        progress: 0,
        target: 50,
        type: 'tasks'
      }
    ],
    categories: [
      { id: 'all', name: '全部', count: 0 },
      { id: 'unlocked', name: '已解锁', count: 0 },
      { id: 'locked', name: '未解锁', count: 0 }
    ],
    currentCategory: 'all'
  },

  onLoad: function() {
    // 获取主题色
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({
      themeColor: themeColor
    });
    
    this.loadUserData();
    this.updateAchievements();
  },

  loadUserData: function() {
    // 从本地存储加载用户数据
    const userLevel = wx.getStorageSync('userLevel') || 1;
    const currentExp = wx.getStorageSync('currentExp') || 0;
    const totalFocusTime = wx.getStorageSync('totalFocusTime') || 0;
    const totalSessions = wx.getStorageSync('totalSessions') || 0;
    const currentStreak = wx.getStorageSync('currentStreak') || 0;
    const maxStreak = wx.getStorageSync('maxStreak') || 0;
    const achievements = wx.getStorageSync('achievements') || this.data.achievements;
    
    // 计算下一级所需经验
    const nextLevelExp = this.calculateNextLevelExp(userLevel);
    
    this.setData({
      userLevel: userLevel,
      currentExp: currentExp,
      nextLevelExp: nextLevelExp,
      totalFocusTime: totalFocusTime,
      totalSessions: totalSessions,
      currentStreak: currentStreak,
      maxStreak: maxStreak,
      achievements: achievements
    });
  },

  calculateNextLevelExp: function(level) {
    // 每级所需经验递增
    return level * 100;
  },

  updateAchievements: function() {
    const achievements = this.data.achievements.map(function(achievement) {
      let progress = 0;
      
      switch (achievement.type) {
        case 'sessions':
          progress = this.data.totalSessions;
          break;
        case 'time':
          progress = this.data.totalFocusTime;
          break;
        case 'streak':
          progress = this.data.maxStreak;
          break;
        case 'tasks':
          progress = wx.getStorageSync('completedTasks') || 0;
          break;
        case 'special':
        case 'perfect':
          progress = wx.getStorageSync('achievement_' + achievement.id) || 0;
          break;
      }
      
      achievement.progress = Math.min(progress, achievement.target);
      achievement.unlocked = progress >= achievement.target;
      
      return achievement;
    });
    
    // 更新分类统计
    const categories = this.data.categories.map(function(category) {
      let count = 0;
      switch (category.id) {
        case 'all':
          count = achievements.length;
          break;
        case 'unlocked':
          count = achievements.filter(function(a) { return a.unlocked; }).length;
          break;
        case 'locked':
          count = achievements.filter(function(a) { return !a.unlocked; }).length;
          break;
      }
      category.count = count;
      return category;
    });
    
    this.setData({
      achievements: achievements,
      categories: categories
    });
    
    // 保存成就数据
    wx.setStorageSync('achievements', achievements);
  },

  switchCategory: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      currentCategory: categoryId
    });
  },


});
