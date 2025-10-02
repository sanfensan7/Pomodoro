const goalManager = require('../../utils/goal-manager');
const logger = require('../../utils/logger');

Page({
  data: {
    themeColor: '#ff6b6b',
    
    // 每日目标
    dailyGoal: {
      enabled: true,
      target: 120
    },
    
    // 每周目标
    weeklyGoal: {
      enabled: true,
      target: 600
    },
    
    // 预设目标选项
    dailyPresets: [60, 90, 120, 150, 180, 240],
    weeklyPresets: [300, 420, 600, 840, 1200],
    
    // 自定义输入
    customDaily: '',
    customWeekly: ''
  },

  onLoad: function() {
    // 加载当前目标设置
    this.loadGoals();
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
   * 加载目标设置
   */
  loadGoals: function() {
    const goals = goalManager.getGoals();
    this.setData({
      dailyGoal: goals.daily,
      weeklyGoal: goals.weekly
    });
    logger.log('目标设置已加载', goals);
  },

  /**
   * 切换每日目标启用状态
   */
  toggleDailyGoal: function(e) {
    const enabled = e.detail.value;
    this.setData({
      'dailyGoal.enabled': enabled
    });
    
    goalManager.updateDailyGoal(this.data.dailyGoal.target, enabled);
    
    wx.showToast({
      title: enabled ? '每日目标已启用' : '每日目标已关闭',
      icon: 'success'
    });
  },

  /**
   * 切换每周目标启用状态
   */
  toggleWeeklyGoal: function(e) {
    const enabled = e.detail.value;
    this.setData({
      'weeklyGoal.enabled': enabled
    });
    
    goalManager.updateWeeklyGoal(this.data.weeklyGoal.target, enabled);
    
    wx.showToast({
      title: enabled ? '每周目标已启用' : '每周目标已关闭',
      icon: 'success'
    });
  },

  /**
   * 选择每日预设目标
   */
  selectDailyPreset: function(e) {
    const target = e.currentTarget.dataset.value;
    this.setData({
      'dailyGoal.target': target,
      customDaily: ''
    });
    
    goalManager.updateDailyGoal(target, this.data.dailyGoal.enabled);
    
    wx.vibrateShort();
    wx.showToast({
      title: `每日目标设为 ${target} 分钟`,
      icon: 'success'
    });
  },

  /**
   * 选择每周预设目标
   */
  selectWeeklyPreset: function(e) {
    const target = e.currentTarget.dataset.value;
    this.setData({
      'weeklyGoal.target': target,
      customWeekly: ''
    });
    
    goalManager.updateWeeklyGoal(target, this.data.weeklyGoal.enabled);
    
    wx.vibrateShort();
    wx.showToast({
      title: `每周目标设为 ${target} 分钟`,
      icon: 'success'
    });
  },

  /**
   * 自定义每日目标输入
   */
  onCustomDailyInput: function(e) {
    this.setData({
      customDaily: e.detail.value
    });
  },

  /**
   * 确认自定义每日目标
   */
  confirmCustomDaily: function() {
    const value = parseInt(this.data.customDaily);
    
    if (!value || value <= 0) {
      wx.showToast({
        title: '请输入有效的分钟数',
        icon: 'none'
      });
      return;
    }
    
    if (value > 1440) {
      wx.showToast({
        title: '每日目标不能超过24小时',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'dailyGoal.target': value
    });
    
    goalManager.updateDailyGoal(value, this.data.dailyGoal.enabled);
    
    wx.showToast({
      title: `每日目标设为 ${value} 分钟`,
      icon: 'success'
    });
  },

  /**
   * 自定义每周目标输入
   */
  onCustomWeeklyInput: function(e) {
    this.setData({
      customWeekly: e.detail.value
    });
  },

  /**
   * 确认自定义每周目标
   */
  confirmCustomWeekly: function() {
    const value = parseInt(this.data.customWeekly);
    
    if (!value || value <= 0) {
      wx.showToast({
        title: '请输入有效的分钟数',
        icon: 'none'
      });
      return;
    }
    
    if (value > 10080) {
      wx.showToast({
        title: '每周目标不能超过168小时',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'weeklyGoal.target': value
    });
    
    goalManager.updateWeeklyGoal(value, this.data.weeklyGoal.enabled);
    
    wx.showToast({
      title: `每周目标设为 ${value} 分钟`,
      icon: 'success'
    });
  },

  /**
   * 格式化时间显示
   */
  formatMinutes: function(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
    }
    return `${mins}分钟`;
  }
});


