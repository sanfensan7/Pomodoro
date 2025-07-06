// 奖励系统模块
class RewardSystem {
  constructor() {
    this.titles = this.loadTitles();
    this.unlockedThemes = this.loadUnlockedThemes();
  }

  // 加载称号数据
  loadTitles() {
    try {
      return wx.getStorageSync('userTitles') || [];
    } catch (e) {
      console.error('Failed to load titles:', e);
      return [];
    }
  }

  // 保存称号数据
  saveTitles() {
    try {
      wx.setStorageSync('userTitles', this.titles);
    } catch (e) {
      console.error('Failed to save titles:', e);
    }
  }

  // 加载解锁的主题
  loadUnlockedThemes() {
    try {
      return wx.getStorageSync('unlockedThemes') || ['#ff6b6b']; // 默认主题
    } catch (e) {
      console.error('Failed to load unlocked themes:', e);
      return ['#ff6b6b'];
    }
  }

  // 保存解锁的主题
  saveUnlockedThemes() {
    try {
      wx.setStorageSync('unlockedThemes', this.unlockedThemes);
    } catch (e) {
      console.error('Failed to save unlocked themes:', e);
    }
  }

  // 处理成就奖励
  processAchievementReward(achievement) {
    var rewards = [];

    // 经验值奖励（已在成就追踪器中处理）
    rewards.push({
      type: 'exp',
      value: achievement.expReward,
      description: '+' + achievement.expReward + ' 经验值'
    });

    // 根据成就类型和稀有度给予特殊奖励
    var specialRewards = this.getSpecialRewards(achievement);
    rewards = rewards.concat(specialRewards);

    // 应用奖励
    this.applyRewards(rewards);

    return rewards;
  }

  // 获取特殊奖励
  getSpecialRewards(achievement) {
    var rewards = [];

    // 称号奖励
    var title = this.getTitleForAchievement(achievement);
    if (title) {
      rewards.push({
        type: 'title',
        value: title,
        description: '获得称号: ' + title.name
      });
    }

    // 主题奖励
    var theme = this.getThemeForAchievement(achievement);
    if (theme) {
      rewards.push({
        type: 'theme',
        value: theme,
        description: '解锁主题: ' + theme.name
      });
    }

    return rewards;
  }

  // 根据成就获取称号
  getTitleForAchievement(achievement) {
    var titleMap = {
      'first_focus': { id: 'beginner', name: '初学者', icon: '🌱', color: '#4CAF50' },
      'focus_master': { id: 'master', name: '专注大师', icon: '🏆', color: '#FFD700' },
      'time_lord': { id: 'time_lord', name: '时间领主', icon: '⏰', color: '#2196F3' },
      'streak_legend': { id: 'streak_legend', name: '连击传奇', icon: '🔥', color: '#FF5722' },
      'perfectionist': { id: 'perfectionist', name: '完美主义者', icon: '💎', color: '#9C27B0' },
      'focus_god': { id: 'focus_god', name: '专注之神', icon: '👑', color: '#FF6B9D' },
      'early_bird': { id: 'early_bird', name: '早起鸟儿', icon: '🌅', color: '#FF9800' },
      'night_owl': { id: 'night_owl', name: '夜猫子', icon: '🦉', color: '#795548' }
    };

    var title = titleMap[achievement.id];
    if (title && !this.hasTitle(title.id)) {
      return title;
    }
    return null;
  }

  // 根据成就获取主题
  getThemeForAchievement(achievement) {
    var themeMap = {
      'focus_expert': { id: 'blue', name: '海洋蓝', color: '#2196F3' },
      'time_master': { id: 'green', name: '森林绿', color: '#4CAF50' },
      'streak_warrior': { id: 'orange', name: '活力橙', color: '#FF9800' },
      'perfectionist': { id: 'purple', name: '神秘紫', color: '#9C27B0' },
      'focus_legend': { id: 'gold', name: '荣耀金', color: '#FFD700' },
      'time_lord': { id: 'cyan', name: '科技青', color: '#00BCD4' },
      'streak_legend': { id: 'red', name: '烈焰红', color: '#F44336' },
      'focus_god': { id: 'pink', name: '樱花粉', color: '#E91E63' }
    };

    var theme = themeMap[achievement.id];
    if (theme && !this.hasTheme(theme.color)) {
      return theme;
    }
    return null;
  }

  // 应用奖励
  applyRewards(rewards) {
    var self = this;
    rewards.forEach(function(reward) {
      switch (reward.type) {
        case 'title':
          self.unlockTitle(reward.value);
          break;
        case 'theme':
          self.unlockTheme(reward.value);
          break;
        // exp 奖励已在成就追踪器中处理
      }
    });
  }

  // 解锁称号
  unlockTitle(title) {
    if (!this.hasTitle(title.id)) {
      this.titles.push(title);
      this.saveTitles();
    }
  }

  // 解锁主题
  unlockTheme(theme) {
    if (!this.hasTheme(theme.color)) {
      this.unlockedThemes.push(theme.color);
      this.saveUnlockedThemes();
    }
  }

  // 检查是否拥有称号
  hasTitle(titleId) {
    return this.titles.some(function(title) {
      return title.id === titleId;
    });
  }

  // 检查是否拥有主题
  hasTheme(themeColor) {
    return this.unlockedThemes.indexOf(themeColor) !== -1;
  }

  // 获取当前称号
  getCurrentTitle() {
    try {
      var currentTitleId = wx.getStorageSync('currentTitle');
      if (currentTitleId) {
        return this.titles.find(function(title) {
          return title.id === currentTitleId;
        });
      }
    } catch (e) {
      console.error('Failed to get current title:', e);
    }
    return null;
  }

  // 设置当前称号
  setCurrentTitle(titleId) {
    try {
      wx.setStorageSync('currentTitle', titleId);
    } catch (e) {
      console.error('Failed to set current title:', e);
    }
  }

  // 获取所有可用称号
  getAllTitles() {
    return this.titles;
  }

  // 获取所有解锁的主题
  getAllUnlockedThemes() {
    return this.unlockedThemes;
  }

  // 获取奖励统计
  getRewardStats() {
    return {
      totalTitles: this.titles.length,
      totalThemes: this.unlockedThemes.length,
      currentTitle: this.getCurrentTitle()
    };
  }

  // 重置奖励（调试用）
  resetRewards() {
    this.titles = [];
    this.unlockedThemes = ['#ff6b6b'];
    this.saveTitles();
    this.saveUnlockedThemes();
    wx.removeStorageSync('currentTitle');
  }
}

// 创建全局实例
var rewardSystem = new RewardSystem();

module.exports = rewardSystem;
