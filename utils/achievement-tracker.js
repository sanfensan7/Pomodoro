// 成就追踪工具模块
const rewardSystem = require('./reward-system');

class AchievementTracker {
  constructor() {
    this.achievements = this.loadAchievements();
    this.listeners = [];
  }

  // 加载成就数据
  loadAchievements() {
    try {
      const saved = wx.getStorageSync('achievements');
      if (saved && Array.isArray(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
    return this.getDefaultAchievements();
  }

  // 保存成就数据
  saveAchievements() {
    try {
      wx.setStorageSync('achievements', this.achievements);
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }

  // 获取默认成就列表
  getDefaultAchievements() {
    return [
      // 这里应该包含所有默认成就，为了简化，只列出几个示例
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
      }
      // ... 其他成就
    ];
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除监听器
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知监听器
  notifyListeners(achievement) {
    this.listeners.forEach(function(callback) {
      try {
        callback(achievement);
      } catch (e) {
        console.error('Achievement listener error:', e);
      }
    });
  }

  // 更新成就进度
  updateProgress(type, value, metadata) {
    var self = this;
    var unlockedAchievements = [];

    this.achievements.forEach(function(achievement) {
      if (achievement.unlocked) return;

      var oldProgress = achievement.progress;
      var newProgress = self.calculateProgress(achievement, type, value, metadata);
      
      if (newProgress > oldProgress) {
        achievement.progress = Math.min(newProgress, achievement.target);
        
        // 检查是否解锁
        if (achievement.progress >= achievement.target && !achievement.unlocked) {
          achievement.unlocked = true;
          unlockedAchievements.push(achievement);

          // 给予经验奖励
          self.giveExpReward(achievement.expReward);

          // 处理特殊奖励
          var rewards = rewardSystem.processAchievementReward(achievement);
          achievement.rewards = rewards;
        }
      }
    });

    // 保存更新后的成就
    this.saveAchievements();

    // 通知新解锁的成就
    unlockedAchievements.forEach(function(achievement) {
      self.notifyListeners(achievement);
    });

    return unlockedAchievements;
  }

  // 计算成就进度
  calculateProgress(achievement, type, value, metadata) {
    switch (achievement.type) {
      case 'sessions':
        return type === 'session_complete' ? (achievement.progress + 1) : achievement.progress;
      
      case 'time':
        return type === 'focus_time' ? value : achievement.progress;
      
      case 'streak':
        return type === 'streak_update' ? value : achievement.progress;
      
      case 'tasks':
        return type === 'task_complete' ? (achievement.progress + 1) : achievement.progress;
      
      case 'special':
        return this.calculateSpecialProgress(achievement, type, value, metadata);
      
      case 'perfect':
        return type === 'perfect_session' ? (achievement.progress + 1) : achievement.progress;
      
      default:
        return achievement.progress;
    }
  }

  // 计算特殊成就进度
  calculateSpecialProgress(achievement, type, value, metadata) {
    if (type !== 'session_complete' || !metadata) {
      return achievement.progress;
    }

    var now = new Date();
    var hour = now.getHours();
    var day = now.getDay(); // 0 = Sunday, 6 = Saturday

    switch (achievement.id) {
      case 'early_bird':
        return (hour >= 6 && hour < 8) ? 1 : achievement.progress;
      
      case 'night_owl':
        return (hour >= 22 || hour < 2) ? 1 : achievement.progress;
      
      case 'weekend_warrior':
        return (day === 0 || day === 6) ? 1 : achievement.progress;
      
      default:
        return achievement.progress;
    }
  }

  // 给予经验奖励
  giveExpReward(expReward) {
    try {
      var currentExp = wx.getStorageSync('currentExp') || 0;
      var newExp = currentExp + expReward;
      wx.setStorageSync('currentExp', newExp);
    } catch (e) {
      console.error('Failed to give exp reward:', e);
    }
  }

  // 获取成就统计
  getStats() {
    var total = this.achievements.length;
    var unlocked = this.achievements.filter(function(a) { return a.unlocked; }).length;
    var totalExp = this.achievements
      .filter(function(a) { return a.unlocked; })
      .reduce(function(sum, a) { return sum + a.expReward; }, 0);

    return {
      total: total,
      unlocked: unlocked,
      locked: total - unlocked,
      completionRate: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      totalExpEarned: totalExp
    };
  }

  // 获取按类型分组的成就
  getAchievementsByType() {
    var groups = {};
    this.achievements.forEach(function(achievement) {
      if (!groups[achievement.type]) {
        groups[achievement.type] = [];
      }
      groups[achievement.type].push(achievement);
    });
    return groups;
  }

  // 获取按难度分组的成就
  getAchievementsByDifficulty() {
    var groups = {};
    this.achievements.forEach(function(achievement) {
      if (!groups[achievement.difficulty]) {
        groups[achievement.difficulty] = [];
      }
      groups[achievement.difficulty].push(achievement);
    });
    return groups;
  }

  // 重置所有成就（调试用）
  resetAllAchievements() {
    this.achievements = this.getDefaultAchievements();
    this.saveAchievements();
  }
}

// 创建全局实例
var achievementTracker = new AchievementTracker();

module.exports = achievementTracker;
