const app = getApp();
const vibrate = require('../../utils/vibrate');

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
    keepScreenOn: true,

    // 提醒设置
    vibrateEnabled: true,
    popupEnabled: true,

    // 完成提醒设置
    repeatIndex: 1,
    repeatOptions: ['1次', '2次', '3次', '5次', '持续提醒'],
    reminderIntervalIndex: 1,
    reminderIntervalOptions: [
      { name: '立即', value: 0 },
      { name: '3秒后', value: 3 },
      { name: '5秒后', value: 5 },
      { name: '10秒后', value: 10 },
      { name: '30秒后', value: 30 }
    ]
  },

  onLoad: function() {
    console.log('设置页面加载中...');

    try {
      // 启用分享功能
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      // 获取已保存的设置
      this.loadSettings();

      // 获取全局主题色
      if (app.globalData.themeColor) {
        this.setData({
          themeColor: app.globalData.themeColor,
          themeColorRGB: hexToRgb(app.globalData.themeColor)
        });
      }

      console.log('设置页面加载完成');
    } catch (error) {
      console.error('设置页面加载失败:', error);
    }
  },
  
  loadSettings: function() {
    try {
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
    const keepScreenOn = wx.getStorageSync('keepScreenOn');
    const vibrateEnabled = wx.getStorageSync('vibrateEnabled');
    const popupEnabled = wx.getStorageSync('popupEnabled');
    const repeatIndex = wx.getStorageSync('repeatIndex') || 1;
    const reminderIntervalIndex = wx.getStorageSync('reminderIntervalIndex') || 1;
    
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
      keepScreenOn: keepScreenOn !== null ? keepScreenOn : true,
      vibrateEnabled: vibrateEnabled !== null ? vibrateEnabled : true,
      popupEnabled: popupEnabled !== null ? popupEnabled : true,
      repeatIndex: repeatIndex,
      reminderIntervalIndex: reminderIntervalIndex
    });

    console.log('设置加载完成');
    } catch (error) {
      console.error('加载设置失败:', error);
      // 设置默认值
      this.setData({
        focusDurationIndex: 0,
        shortBreakDurationIndex: 0,
        longBreakDurationIndex: 2,
        longBreakIntervalIndex: 3,
        timerStyle: 'circle',
        themeColor: '#ff6b6b',
        themeColorRGB: 'rgb(255, 107, 107)',
        currentTheme: 'red',
        autoStartBreak: true,
        autoStartFocus: false,
        keepScreenOn: true,
        vibrateEnabled: true,
        popupEnabled: true,
        repeatIndex: 1,
        reminderIntervalIndex: 1
      });
    }
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
    wx.setStorageSync('keepScreenOn', this.data.keepScreenOn);
    wx.setStorageSync('vibrateEnabled', this.data.vibrateEnabled);
    wx.setStorageSync('popupEnabled', this.data.popupEnabled);
    wx.setStorageSync('repeatIndex', this.data.repeatIndex);
    wx.setStorageSync('reminderIntervalIndex', this.data.reminderIntervalIndex);

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
    vibrate.buttonTap();
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

  toggleKeepScreenOn: function(e) {
    this.setData({
      keepScreenOn: e.detail.value
    });
    this.saveSettings();

    wx.showToast({
      title: e.detail.value ? '已启用屏幕常亮' : '已关闭屏幕常亮',
      icon: 'success'
    });
  },

  toggleVibrate: function(e) {
    const value = e.detail.value;
    this.setData({
      vibrateEnabled: value
    });
    this.saveSettings();

    // 测试震动效果
    if (value) {
      wx.vibrateShort({
        type: 'light'
      });
    }

    wx.showToast({
      title: value ? '已启用震动反馈' : '已关闭震动反馈',
      icon: 'success'
    });

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

  togglePopup: function(e) {
    const value = e.detail.value;
    this.setData({
      popupEnabled: value
    });
    this.saveSettings();

    wx.showToast({
      title: value ? '弹窗提醒已开启' : '弹窗提醒已关闭',
      icon: 'success'
    });
  },

  changeRepeatCount: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      repeatIndex: index
    });
    this.saveSettings();

    wx.showToast({
      title: '重复次数已更改',
      icon: 'success'
    });
  },

  changeReminderInterval: function(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      reminderIntervalIndex: index
    });
    this.saveSettings();

    wx.showToast({
      title: '提醒间隔已更改',
      icon: 'success'
    });
  },

  changeTheme: function(e) {
    vibrate.buttonTap();

    const color = e.currentTarget.dataset.color;
    const theme = e.currentTarget.dataset.theme;

    this.setData({
      themeColor: color,
      themeColorRGB: hexToRgb(color),
      currentTheme: theme
    });

    this.saveSettings();

    // 通知其他页面主题已更改
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.route === 'pages/focus/focus' && page.loadSettings) {
        page.setData({ themeColor: color });
        // 重新绘制进度环以应用新主题色
        if (page.drawProgressRing) {
          setTimeout(() => {
            page.drawProgressRing();
          }, 100);
        }
        if (page.drawProgressLine) {
          setTimeout(() => {
            page.drawProgressLine();
          }, 100);
        }
      }
    });

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

    // 通知其他页面计时器样式已更改
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (page.route === 'pages/focus/focus' && page.loadSettings) {
        page.loadSettings();
      }
    });

    wx.showToast({
      title: '样式已更改',
      icon: 'success'
    });
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return {
      title: '我在使用这个番茄钟小程序，专注学习效率很高！',
      path: '/pages/focus/focus',
      imageUrl: '',
      desc: '番茄工作法 + 错题本 + 任务管理，学习效率神器！'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '番茄钟学习神器 - 专注学习，高效管理',
      query: '',
      imageUrl: ''
    };
  }

});