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
      // 新手成就 - 青铜级
      {
        id: 'first_focus',
        title: '初次专注',
        description: '完成第一次专注',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'sessions',
        rarity: 'common',
        difficulty: 'bronze',
        expReward: 50
      },
      {
        id: 'focus_beginner',
        title: '专注新手',
        description: '累计专注5次',
        icon: '🌱',
        unlocked: false,
        progress: 0,
        target: 5,
        type: 'sessions',
        rarity: 'common',
        difficulty: 'bronze',
        expReward: 100
      },
      {
        id: 'time_starter',
        title: '时间新手',
        description: '累计专注2小时',
        icon: '⏱️',
        unlocked: false,
        progress: 0,
        target: 120, // 2小时 = 120分钟
        type: 'time',
        rarity: 'common',
        difficulty: 'bronze',
        expReward: 100
      },

      // 进阶成就 - 白银级
      {
        id: 'focus_enthusiast',
        title: '专注爱好者',
        description: '累计专注25次',
        icon: '🎪',
        unlocked: false,
        progress: 0,
        target: 25,
        type: 'sessions',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 200
      },
      {
        id: 'time_keeper',
        title: '时间守护者',
        description: '累计专注10小时',
        icon: '⏰',
        unlocked: false,
        progress: 0,
        target: 600, // 10小时 = 600分钟
        type: 'time',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 250
      },
      {
        id: 'streak_starter',
        title: '连击新手',
        description: '连续专注3天',
        icon: '🔥',
        unlocked: false,
        progress: 0,
        target: 3,
        type: 'streak',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 200
      },
      {
        id: 'task_organizer',
        title: '任务管理者',
        description: '完成10个任务',
        icon: '📝',
        unlocked: false,
        progress: 0,
        target: 10,
        type: 'tasks',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 150
      },

      // 高级成就 - 黄金级
      {
        id: 'focus_expert',
        title: '专注专家',
        description: '累计专注50次',
        icon: '🎖️',
        unlocked: false,
        progress: 0,
        target: 50,
        type: 'sessions',
        rarity: 'rare',
        difficulty: 'gold',
        expReward: 300
      },
      {
        id: 'focus_master',
        title: '专注大师',
        description: '累计专注100次',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        target: 100,
        type: 'sessions',
        rarity: 'rare',
        difficulty: 'gold',
        expReward: 500
      },
      {
        id: 'time_master',
        title: '时间大师',
        description: '累计专注25小时',
        icon: '⌚',
        unlocked: false,
        progress: 0,
        target: 1500, // 25小时 = 1500分钟
        type: 'time',
        rarity: 'rare',
        difficulty: 'gold',
        expReward: 400
      },
      {
        id: 'streak_warrior',
        title: '连击战士',
        description: '连续专注7天',
        icon: '⚔️',
        unlocked: false,
        progress: 0,
        target: 7,
        type: 'streak',
        rarity: 'rare',
        difficulty: 'gold',
        expReward: 350
      },
      {
        id: 'task_master',
        title: '任务大师',
        description: '完成30个任务',
        icon: '📋',
        unlocked: false,
        progress: 0,
        target: 30,
        type: 'tasks',
        rarity: 'rare',
        difficulty: 'gold',
        expReward: 300
      },

      // 传奇成就 - 钻石级
      {
        id: 'focus_legend',
        title: '专注传奇',
        description: '累计专注200次',
        icon: '👑',
        unlocked: false,
        progress: 0,
        target: 200,
        type: 'sessions',
        rarity: 'epic',
        difficulty: 'diamond',
        expReward: 800
      },
      {
        id: 'time_lord',
        title: '时间领主',
        description: '累计专注50小时',
        icon: '🌟',
        unlocked: false,
        progress: 0,
        target: 3000, // 50小时 = 3000分钟
        type: 'time',
        rarity: 'epic',
        difficulty: 'diamond',
        expReward: 700
      },
      {
        id: 'streak_legend',
        title: '连击传奇',
        description: '连续专注30天',
        icon: '🌪️',
        unlocked: false,
        progress: 0,
        target: 30,
        type: 'streak',
        rarity: 'epic',
        difficulty: 'diamond',
        expReward: 1000
      },
      {
        id: 'perfectionist',
        title: '完美主义者',
        description: '连续20次专注不中断',
        icon: '💎',
        unlocked: false,
        progress: 0,
        target: 20,
        type: 'perfect',
        rarity: 'epic',
        difficulty: 'diamond',
        expReward: 600
      },

      // 特殊时间成就
      {
        id: 'early_bird',
        title: '早起鸟儿',
        description: '在早上6-8点完成专注',
        icon: '🌅',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'special',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 150
      },
      {
        id: 'night_owl',
        title: '夜猫子',
        description: '在晚上10-12点完成专注',
        icon: '🦉',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'special',
        rarity: 'uncommon',
        difficulty: 'silver',
        expReward: 150
      },
      {
        id: 'weekend_warrior',
        title: '周末战士',
        description: '在周末完成专注',
        icon: '🏖️',
        unlocked: false,
        progress: 0,
        target: 1,
        type: 'special',
        rarity: 'common',
        difficulty: 'bronze',
        expReward: 100
      },

      // 超级成就 - 神话级
      {
        id: 'focus_god',
        title: '专注之神',
        description: '累计专注500次',
        icon: '🔮',
        unlocked: false,
        progress: 0,
        target: 500,
        type: 'sessions',
        rarity: 'legendary',
        difficulty: 'mythic',
        expReward: 2000
      },
      {
        id: 'time_infinity',
        title: '时间无限',
        description: '累计专注100小时',
        icon: '♾️',
        unlocked: false,
        progress: 0,
        target: 6000, // 100小时 = 6000分钟
        type: 'time',
        rarity: 'legendary',
        difficulty: 'mythic',
        expReward: 1500
      },
      {
        id: 'streak_immortal',
        title: '不朽连击',
        description: '连续专注100天',
        icon: '🌌',
        unlocked: false,
        progress: 0,
        target: 100,
        type: 'streak',
        rarity: 'legendary',
        difficulty: 'mythic',
        expReward: 3000
      }
    ],
    categories: [
      { id: 'unlocked', name: '已解锁', count: 0 },
      { id: 'locked', name: '未解锁', count: 0 }
    ],
    currentCategory: 'unlocked',
    themeColor: '#ff6b6b',
    showUnlockAnimation: false,
    unlockedAchievement: {}
  },

  onLoad: function() {
    // 获取主题色
    var themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({
      themeColor: themeColor
    });
    
    this.loadUserData();
    this.updateAchievements();
  },

  loadUserData: function() {
    // 从本地存储加载用户数据
    var userLevel = wx.getStorageSync('userLevel') || 1;
    var currentExp = wx.getStorageSync('currentExp') || 0;
    var totalFocusTime = wx.getStorageSync('totalFocusTime') || 0;
    var totalSessions = wx.getStorageSync('totalSessions') || 0;
    var currentStreak = wx.getStorageSync('currentStreak') || 0;
    var maxStreak = wx.getStorageSync('maxStreak') || 0;
    var achievements = wx.getStorageSync('achievements') || this.data.achievements;

    // 计算下一级所需经验
    var nextLevelExp = this.calculateNextLevelExp(userLevel);
    
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

    // 更新分类计数
    this.updateCategoryCount();
  },

  calculateNextLevelExp: function(level) {
    // 每级所需经验递增
    return level * 100;
  },

  updateCategoryCount: function() {
    var achievements = this.data.achievements;
    var unlockedCount = 0;
    var lockedCount = 0;

    for (var i = 0; i < achievements.length; i++) {
      if (achievements[i].unlocked) {
        unlockedCount++;
      } else {
        lockedCount++;
      }
    }

    var categories = this.data.categories.map(function(category) {
      if (category.id === 'unlocked') {
        category.count = unlockedCount;
      } else if (category.id === 'locked') {
        category.count = lockedCount;
      }
      return category;
    });

    this.setData({
      categories: categories
    });
  },

  updateAchievements: function() {
    var self = this;
    var achievements = this.data.achievements.map(function(achievement) {
      var progress = 0;

      switch (achievement.type) {
        case 'sessions':
          progress = self.data.totalSessions;
          break;
        case 'time':
          progress = self.data.totalFocusTime;
          break;
        case 'streak':
          progress = self.data.maxStreak;
          break;
        case 'tasks':
          progress = wx.getStorageSync('completedTasks') || 0;
          break;
        case 'special':
        case 'perfect':
          progress = wx.getStorageSync('achievement_' + achievement.id) || 0;
          break;
      }

      var wasUnlocked = achievement.unlocked;
      achievement.progress = Math.min(progress, achievement.target);
      achievement.unlocked = progress >= achievement.target;

      // 检查是否新解锁成就
      if (!wasUnlocked && achievement.unlocked) {
        self.showAchievementUnlocked(achievement);
      }

      return achievement;
    });

    // 更新分类统计
    var categories = this.data.categories.map(function(category) {
      var count = 0;
      switch (category.id) {
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

  showAchievementUnlocked: function(achievement) {
    // 显示成就解锁动画
    this.setData({
      showUnlockAnimation: true,
      unlockedAchievement: achievement
    });

    // 给予经验奖励
    var currentExp = wx.getStorageSync('currentExp') || 0;
    var newExp = currentExp + achievement.expReward;
    wx.setStorageSync('currentExp', newExp);

    // 震动反馈
    wx.vibrateShort && wx.vibrateShort();

    // 弹窗提醒
    wx.showToast({
      title: '成就解锁！',
      icon: 'success',
      duration: 2000
    });
  },

  onUnlockAnimationHide: function() {
    this.setData({
      showUnlockAnimation: false,
      unlockedAchievement: {}
    });
  },

  shareAchievement: function(e) {
    var achievement = e.currentTarget.dataset.achievement;
    if (!achievement || !achievement.unlocked) return;

    var rarityText = this.getRarityText(achievement.rarity);
    var difficultyText = this.getDifficultyText(achievement.difficulty);

    // 生成分享内容
    var shareContent = this.generateShareContent(achievement, rarityText, difficultyText);

    // 显示分享选项
    wx.showActionSheet({
      itemList: ['分享到微信', '生成成就海报', '复制成就信息'],
      success: function(res) {
        switch (res.tapIndex) {
          case 0:
            // 分享到微信
            wx.showShareMenu({
              withShareTicket: true,
              menus: ['shareAppMessage', 'shareTimeline']
            });
            break;
          case 1:
            // 生成成就海报
            this.generateAchievementPoster(achievement, shareContent);
            break;
          case 2:
            // 复制成就信息
            wx.setClipboardData({
              data: shareContent.text,
              success: function() {
                wx.showToast({
                  title: '已复制到剪贴板',
                  icon: 'success'
                });
              }
            });
            break;
        }
      }.bind(this)
    });
  },

  generateShareContent: function(achievement, rarityText, difficultyText) {
    var currentDate = new Date().toLocaleDateString();
    var text = '🎉 我在番茄专注钟解锁了新成就！\n\n' +
                 '🏆 ' + achievement.title + '\n' +
                 '📝 ' + achievement.description + '\n' +
                 '⭐ 稀有度：' + rarityText + '\n' +
                 '💎 难度：' + difficultyText + '\n' +
                 '🌟 经验奖励：+' + achievement.expReward + ' EXP\n' +
                 '📅 解锁时间：' + currentDate + '\n\n' +
                 '一起来专注学习吧！';

    return {
      title: '我解锁了新成就：' + achievement.title,
      text: text,
      imageUrl: '', // 可以添加成就图片
      path: '/pages/achievements/achievements'
    };
  },

  generateAchievementPoster: function(achievement, shareContent) {
    // 这里可以实现生成海报的功能
    // 由于微信小程序的限制，这里只是显示一个提示
    wx.showModal({
      title: '成就海报',
      content: '海报生成功能正在开发中，敬请期待！\n\n您可以选择"复制成就信息"来分享您的成就。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  getRarityText: function(rarity) {
    var rarityMap = {
      'common': '普通',
      'uncommon': '稀有',
      'rare': '史诗',
      'epic': '传说',
      'legendary': '神话'
    };
    return rarityMap[rarity] || '未知';
  },

  getDifficultyText: function(difficulty) {
    var difficultyMap = {
      'bronze': '青铜',
      'silver': '白银',
      'gold': '黄金',
      'diamond': '钻石',
      'mythic': '神话'
    };
    return difficultyMap[difficulty] || '未知';
  },

  switchCategory: function(e) {
    var categoryId = e.currentTarget.dataset.id;
    this.setData({
      currentCategory: categoryId
    });
  },

  // 页面分享配置
  onShareAppMessage: function() {
    var stats = this.getAchievementStats();
    return {
      title: '我在番茄专注钟已解锁 ' + stats.unlocked + ' 个成就！',
      path: '/pages/achievements/achievements',
      imageUrl: '' // 可以添加分享图片
    };
  },

  onShareTimeline: function() {
    var stats = this.getAchievementStats();
    return {
      title: '番茄专注钟 - 我的成就：' + stats.unlocked + '/' + stats.total,
      query: '',
      imageUrl: '' // 可以添加分享图片
    };
  },

  getAchievementStats: function() {
    var total = this.data.achievements.length;
    var unlocked = this.data.achievements.filter(function(a) { return a.unlocked; }).length;
    return { total: total, unlocked: unlocked };
  }
});
