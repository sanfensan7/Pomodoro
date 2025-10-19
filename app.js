// app.js
const vibrate = require('./utils/vibrate');
const logger = require('./utils/logger');
const storageManager = require('./utils/storage-manager');

App({
  globalData: {
    themeColor: '#ff6b6b',
    currentTheme: 'red',
    timerStyle: 'circle',
    nextMode: null,
    autoStart: false
  },

  // 全局震动方法
  vibrate: vibrate,
  
  // 全局错误处理
  onError: function(error) {
    logger.error('全局错误捕获', error, {
      stack: error.stack || error,
      time: new Date().toISOString()
    });
    
    // 可选：显示用户友好的错误提示
    if (typeof error === 'string' && error.includes('Error')) {
      wx.showToast({
        title: '程序出错了，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  // 未处理的Promise拒绝
  onUnhandledRejection: function(res) {
    logger.error('未处理的Promise拒绝', null, {
      reason: res.reason,
      promise: res.promise,
      time: new Date().toISOString()
    });
  },
  
  // 页面未找到
  onPageNotFound: function(res) {
    logger.warn('页面未找到', {
      path: res.path,
      query: res.query,
      isEntryPage: res.isEntryPage
    });
    
    // 重定向到首页
    wx.redirectTo({
      url: '/pages/focus/focus',
      fail: function() {
        wx.switchTab({
          url: '/pages/focus/focus'
        });
      }
    });
  },
  
  onLaunch: function() {
    try {
      logger.log('小程序启动', {
        version: '1.2.4',
        time: new Date().toISOString()
      });
      
      // 初始化存储管理器（包含版本检查和数据迁移）
      storageManager.checkVersion();
      
      // 获取已保存的设置
      this.loadSettings();
      
      // 检查是否有保存的数据
      this.checkAndInitStorage();
      
      // 记录存储使用情况
      const storageInfo = storageManager.getStorageInfo();
      logger.log('存储使用情况', storageInfo);
      
    } catch (error) {
      logger.error('小程序启动失败', error);
    }
  },
  
  loadSettings: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    const currentTheme = wx.getStorageSync('currentTheme') || 'red';
    const timerStyle = wx.getStorageSync('timerStyle') || 'circle';
    
    this.globalData.themeColor = themeColor;
    this.globalData.currentTheme = currentTheme;
    this.globalData.timerStyle = timerStyle;
  },
  
  checkAndInitStorage: function() {
    // 如果没有保存的任务列表，初始化一个空列表
    if (!wx.getStorageSync('tasks')) {
      wx.setStorageSync('tasks', []);
    }

    // 检查今日统计数据是否为当天的
    const today = new Date().toDateString();
    let todayStats = wx.getStorageSync('todayStats') || { date: today, completed: 0, focusTime: 0 };

    if (todayStats.date !== today) {
      // 是新的一天，重置统计数据
      todayStats = { date: today, completed: 0, focusTime: 0 };
      wx.setStorageSync('todayStats', todayStats);
    }

    // 检查是否初始化了设置
    if (!wx.getStorageSync('focusDuration')) {
      wx.setStorageSync('focusDuration', 25);
      wx.setStorageSync('shortBreakDuration', 5);
      wx.setStorageSync('longBreakDuration', 15);
      wx.setStorageSync('longBreakInterval', 4);
      wx.setStorageSync('autoStartBreak', true);
      wx.setStorageSync('autoStartFocus', false);
    }
  },


});
