var app = getApp();
var shareHelper = require('../../utils/share-helper');

Page({
  data: {
    themeColor: '#ff6b6b',
    focusDuration: '25分钟',
    todayCompleted: 0
  },

  onLoad: function() {
    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 获取全局主题色
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }

    // 获取专注时长
    var focusDuration = wx.getStorageSync('focusDuration') || 25;

    // 获取今日完成数
    var todayStats = wx.getStorageSync('todayStats') || { completed: 0 };

    this.setData({
      focusDuration: focusDuration + '分钟',
      todayCompleted: todayStats.completed
    });
  },
  
  startBreak: function() {
    // 检查是否应该开始长休息
    var longBreakInterval = wx.getStorageSync('longBreakInterval') || 4;
    var todayStats = wx.getStorageSync('todayStats') || { completed: 0 };

    // 如果完成的专注次数是长休息间隔的倍数，则开始长休息
    if (todayStats.completed > 0 && todayStats.completed % longBreakInterval === 0) {
      app.globalData.nextMode = 'longBreak';
    } else {
      app.globalData.nextMode = 'shortBreak';
    }

    // 返回到专注页面
    wx.navigateBack({
      delta: 1
    });
  },

  backToFocus: function() {
    app.globalData.nextMode = 'focus';

    // 返回到专注页面
    wx.navigateBack({
      delta: 1
    });
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return shareHelper.getShareAppMessageConfig('achievement', '/pages/complete/complete');
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('achievement');
  }
});