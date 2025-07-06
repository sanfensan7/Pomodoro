const app = getApp();

// 辅助函数：将十六进制颜色转换为RGB
function hexToRgb(hex) {
  // 去掉可能的#前缀
  hex = hex.replace(/^#/, '');
  
  // 解析颜色值
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  
  return r + "," + g + "," + b;
}

Page({
  data: {
    themeColor: '#ff6b6b',
    themeColorRGB: '255,107,107',
    currentTheme: 'red',
    timerStyle: 'circle',
    focusDurationIndex: 4, // 默认25分钟
    shortBreakDurationIndex: 0, // 默认5分钟
    longBreakDurationIndex: 2, // 默认15分钟
    longBreakIntervalIndex: 3, // 默认4个专注
    durationOptions: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    breakOptions: [5, 10, 15, 20, 25, 30],
    intervalOptions: [2, 3, 4, 5, 6],
    autoStartBreak: true,
    autoStartFocus: false,

    // 提醒设置
    soundEnabled: true,
    vibrateEnabled: true
  },

  onLoad: function() {
    // 获取已保存的设置
    this.loadSettings();
    
    // 获取全局主题色
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor,
        themeColorRGB: hexToRgb(app.globalData.themeColor)
      });
    }
  },
  
  loadSettings: function() {
    // 从本地存储加载设置
    const focusDuration = wx.getStorageSync('focusDuration') || 25;
    const shortBreakDuration = wx.getStorageSync('shortBreakDuration') || 5;
    const longBreakDuration = wx.getStorageSync('longBreakDuration') || 15;
    const longBreakInterval = wx.getStorageSync('longBreakInterval') || 4;
    const timerStyle = wx.getStorageSync('timerStyle') || 'circle';
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    const currentTheme = wx.getStorageSync('currentTheme') || 'red';
    const autoStartBreak = wx.getStorageSync('autoStartBreak');
    const autoStartFocus = wx.getStorageSync('autoStartFocus');
    const soundEnabled = wx.getStorageSync('soundEnabled');
    const vibrateEnabled = wx.getStorageSync('vibrateEnabled');
    
    // 找到对应的索引
    const focusDurationIndex = this.data.durationOptions.indexOf(focusDuration);
    const shortBreakDurationIndex = this.data.breakOptions.indexOf(shortBreakDuration);
    const longBreakDurationIndex = this.data.breakOptions.indexOf(longBreakDuration);
    const longBreakIntervalIndex = this.data.intervalOptions.indexOf(longBreakInterval);
    
    this.setData({
      focusDurationIndex: focusDurationIndex !== -1 ? focusDurationIndex : 4,
      shortBreakDurationIndex: shortBreakDurationIndex !== -1 ? shortBreakDurationIndex : 0,
      longBreakDurationIndex: longBreakDurationIndex !== -1 ? longBreakDurationIndex : 2,
      longBreakIntervalIndex: longBreakIntervalIndex !== -1 ? longBreakIntervalIndex : 3,
      timerStyle: timerStyle,
      themeColor: themeColor,
      themeColorRGB: hexToRgb(themeColor),
      currentTheme: currentTheme,
      autoStartBreak: autoStartBreak === false ? false : true,
      autoStartFocus: autoStartFocus === true ? true : false,
      soundEnabled: soundEnabled !== null ? soundEnabled : true,
      vibrateEnabled: vibrateEnabled !== null ? vibrateEnabled : true
    });
  },
  
  saveSettings: function() {
    // 保存设置到本地存储
    wx.setStorageSync('focusDuration', this.data.durationOptions[this.data.focusDurationIndex]);
    wx.setStorageSync('shortBreakDuration', this.data.breakOptions[this.data.shortBreakDurationIndex]);
    wx.setStorageSync('longBreakDuration', this.data.breakOptions[this.data.longBreakDurationIndex]);
    wx.setStorageSync('longBreakInterval', this.data.intervalOptions[this.data.longBreakIntervalIndex]);
    wx.setStorageSync('timerStyle', this.data.timerStyle);
    wx.setStorageSync('themeColor', this.data.themeColor);
    wx.setStorageSync('themeColorRGB', this.data.themeColorRGB);
    wx.setStorageSync('currentTheme', this.data.currentTheme);
    wx.setStorageSync('autoStartBreak', this.data.autoStartBreak);
    wx.setStorageSync('autoStartFocus', this.data.autoStartFocus);
    
    // 更新全局变量
    if (app.globalData) {
      app.globalData.themeColor = this.data.themeColor;
    }
  },
  
  changeFocusDuration: function(e) {
    this.setData({
      focusDurationIndex: parseInt(e.detail.value)
    });
    this.saveSettings();
  },
  
  changeShortBreakDuration: function(e) {
    this.setData({
      shortBreakDurationIndex: parseInt(e.detail.value)
    });
    this.saveSettings();
  },
  
  changeLongBreakDuration: function(e) {
    this.setData({
      longBreakDurationIndex: parseInt(e.detail.value)
    });
    this.saveSettings();
  },
  
  changeLongBreakInterval: function(e) {
    this.setData({
      longBreakIntervalIndex: parseInt(e.detail.value)
    });
    this.saveSettings();
  },
  
  toggleAutoStartBreak: function(e) {
    this.setData({
      autoStartBreak: e.detail.value
    });
    this.saveSettings();
  },
  
  toggleAutoStartFocus: function(e) {
    this.setData({
      autoStartFocus: e.detail.value
    });
    this.saveSettings();
  },

  toggleSound: function(e) {
    const value = e.detail.value;
    this.setData({
      soundEnabled: value
    });
    wx.setStorageSync('soundEnabled', value);

    // 播放测试音效
    if (value) {
      wx.showToast({
        title: '音效已开启',
        icon: 'success'
      });
    }
  },

  toggleVibrate: function(e) {
    const value = e.detail.value;
    this.setData({
      vibrateEnabled: value
    });
    wx.setStorageSync('vibrateEnabled', value);

    // 测试震动
    if (value) {
      wx.vibrateShort && wx.vibrateShort({
        type: 'light'
      });
      wx.showToast({
        title: '震动已开启',
        icon: 'success'
      });
    }
  },
  
  changeTheme: function(e) {
    const color = e.currentTarget.dataset.color;
    const theme = e.currentTarget.dataset.theme;
    
    this.setData({
      themeColor: color,
      themeColorRGB: hexToRgb(color),
      currentTheme: theme
    });
    
    this.saveSettings();
    
    wx.showToast({
      title: '主题已更改',
      icon: 'success'
    });
  },
  
  changeTimerStyle: function(e) {
    const style = e.currentTarget.dataset.style;
    
    this.setData({
      timerStyle: style
    });
    
    this.saveSettings();
    
    wx.showToast({
      title: '样式已更改',
      icon: 'success'
    });
  }
}); 