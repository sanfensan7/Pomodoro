// app.js
const vibrate = require('./utils/vibrate');

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
  
  onLaunch: function() {
    // 注释掉图标生成代码，使用预先生成的图标
    // try {
    //   console.log('开始生成内置图标...');
    //   const createDefaultIcons = require('./utils/createDefaultIcons');
    //   createDefaultIcons.createIcons();
    // } catch (e) {
    //   console.error('生成内置图标失败:', e);
    // }

    // // 尝试生成自定义图标
    // try {
    //   console.log('尝试生成自定义图标...');
    //   const svgToPng = require('./utils/svgToPng');
    //   svgToPng.convertSvgToPng();
    // } catch (e) {
    //   console.error('生成自定义图标失败:', e);
    // }
    
    // 检查图标是否存在，并提示用户
    console.log('检查图标资源...');
    
    // 获取已保存的设置
    this.loadSettings();
    
    // 检查是否有保存的数据
    this.checkAndInitStorage();
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
