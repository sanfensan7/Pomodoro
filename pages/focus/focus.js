var app = getApp();
var achievementTracker = require('../../utils/achievement-tracker');
var shareHelper = require('../../utils/share-helper');
var vibrate = require('../../utils/vibrate');
const Task = require('../../utils/task.js');
const Timer = require('../../utils/timer.js');
const FocusStatsManager = require('../../utils/focus-stats-manager');
const canvasHelper = require('../../utils/canvas-helper');

Page({
  data: {
    themeColor: '#ff6b6b',
    timerText: '25:00',
    timerLabel: '专注时间',
    isRunning: false,
    timeLeft: 25 * 60,
    currentMode: 'focus',
    todayCompleted: 0,
    todayFocusTime: '0.0h',
    weekCompleted: 0,
    currentTask: null,
    timerStyle: 'circle',
    
    showCelebration: false
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

    // 初始化 Timer 管理器
    this.timerManager = new Timer(this);
    this.taskManager = new Task(this);
    this.focusStatsManager = new FocusStatsManager();

    // 加载保存的设置
    this.loadSettings();

    // 初始化时钟
    this.timerManager.initTimer();
  },
  
  onShow: function() {
    // 重新加载设置以确保最新设置得到应用
    this.loadSettings();

    // 更新震动设置
    vibrate.updateSettings();

    // 如果从设置页返回，可能需要更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
      this.drawProgress();
    }

    // 如果有下一个模式设置，则切换
    if (app.globalData.nextMode) {
      this.switchMode({ currentTarget: { dataset: { mode: app.globalData.nextMode } } });
      app.globalData.nextMode = null;
    }

    // 检查是否有当前任务
    if (app.globalData.currentTask) {
      this.setData({
        currentTask: app.globalData.currentTask
      });
    }

    // 更新统计数据
    this.updateStats();

    // 如果当前不是计时中状态，重新初始化计时器以应用新设置
    if (!this.data.isRunning) {
      this.timerManager.initTimer();
    } else {
      // 如果正在计时，也要更新进度显示以应用新样式
      setTimeout(() => {
        this.drawProgress();
      }, 100);
    }

    // 页面显示时，如果正在计时且启用了屏幕常亮则重新设置
    if (this.data.isRunning) {
      var keepScreenOn = wx.getStorageSync('keepScreenOn');
      if (keepScreenOn !== false) { // 默认启用
        wx.setKeepScreenOn({
          keepScreenOn: true,
          fail: function(error) {
            console.error('设置屏幕常亮失败:', error);
          }
        });
      }
    }
  },
  
  onUnload: function() {
    // 清除定时器
    if (this.timerManager.timer) {
      clearInterval(this.timerManager.timer);
    }

    // 取消屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: false,
      fail: function(error) {
        console.error('取消屏幕常亮失败:', error);
      }
    });
  },

  onHide: function() {
    // 页面隐藏时取消屏幕常亮，避免在后台时仍保持常亮
    wx.setKeepScreenOn({
      keepScreenOn: false,
      fail: function(error) {
        console.error('取消屏幕常亮失败:', error);
      }
    });
  },



  onReady: function() {
    // 初始化Canvas
    this.initCanvas();
  },
  
  /**
   * 初始化Canvas（使用新版Canvas 2D API）
   */
  initCanvas: async function() {
    try {
      // 根据计时器样式初始化对应的Canvas
      if (this.data.timerStyle === 'circle') {
        this.circleCanvas = await canvasHelper.getCanvas(this, '#progressRing');
      } else if (this.data.timerStyle === 'line') {
        this.lineCanvas = await canvasHelper.getCanvas(this, '#progressLine');
      }
      
      // 绘制初始状态
      this.drawProgress();
    } catch (error) {
      console.error('Canvas初始化失败:', error);
    }
  },
  
  /**
   * 绘制进度（统一入口，节流优化）
   */
  drawProgress: function() {
    // 节流：避免频繁重绘
    if (this.drawTimer) {
      return;
    }
    
    this.drawTimer = setTimeout(() => {
      this.drawTimer = null;
      
      if (this.data.timerStyle === 'circle') {
        this.drawProgressRing();
      } else if (this.data.timerStyle === 'line') {
        this.drawProgressLine();
      }
    }, 100); // 100ms节流
  },
  
  /**
   * 绘制圆形进度条（使用Canvas 2D API）
   */
  drawProgressRing: function() {
    if (!this.circleCanvas) {
      return;
    }
    
    // 计算进度
    const progress = 1 - (this.data.timeLeft / (this.data.totalTime || this.data.timeLeft));
    
    canvasHelper.drawCircularProgress(this.circleCanvas, {
      progress: progress,
      color: this.data.themeColor,
      backgroundColor: '#f0f0f0',
      lineWidth: 15,
      showShadow: false
    });
  },
  
  /**
   * 绘制线性进度条（使用Canvas 2D API）
   */
  drawProgressLine: function() {
    if (!this.lineCanvas) {
      return;
    }
    
    // 计算进度
    const progress = 1 - (this.data.timeLeft / (this.data.totalTime || this.data.timeLeft));
    
    canvasHelper.drawLinearProgress(this.lineCanvas, {
      progress: progress,
      color: this.data.themeColor,
      backgroundColor: '#f0f0f0',
      borderRadius: 5
    });
  },
  
  loadSettings: function() {
    const focusDuration = wx.getStorageSync('focusDuration') || 25;
    const shortBreakDuration = wx.getStorageSync('shortBreakDuration') || 5;
    const longBreakDuration = wx.getStorageSync('longBreakDuration') || 15;
    const timerStyle = wx.getStorageSync('timerStyle') || 'circle';

    // 检查计时器样式是否发生变化
    const oldTimerStyle = this.data.timerStyle;

    this.setData({
      focusDuration: focusDuration,
      shortBreakDuration: shortBreakDuration,
      longBreakDuration: longBreakDuration,
      timerStyle: timerStyle,
      timeLeft: focusDuration * 60
    });

    // 使用 timerManager 更新计时器显示
    this.timerManager.updateTimerDisplay();

    // 如果计时器样式发生变化，重新初始化Canvas
    if (oldTimerStyle !== timerStyle) {
      setTimeout(() => {
        this.initCanvas();
      }, 100); // 延迟一点时间确保DOM更新完成
    }
  },
  
  toggleTimer: function() {
    this.timerManager.toggleTimer();
  },
  
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;

    // 震动反馈
    vibrate.buttonTap();

    this.setData({
      currentMode: mode
    });
    
    clearInterval(this.timerManager.timer);
    this.timerManager.initTimer();
  },
  
  updateTaskProgress: function() {
    this.taskManager.updateTaskProgress();
  },
  
  updateCompletedCount: function() {
    // 更新今日完成数和本周完成数
    const today = new Date();
    const todayString = today.toDateString();
    
    // 获取本周的开始时间（周一）
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    
    // 获取或初始化今日统计
    let todayStats = wx.getStorageSync('todayStats') || { date: todayString, completed: 0, focusTime: 0 };
    if (todayStats.date !== todayString) {
      todayStats = { date: todayString, completed: 0, focusTime: 0 };
    }
    
    // 获取或初始化本周统计
    let weekStats = wx.getStorageSync('weekStats') || { 
      weekStart: weekStart.toISOString(),
      completed: 0,
      dailyStats: {}
    };
    
    // 如果是新的一周，重置周统计
    if (new Date(weekStats.weekStart).getTime() !== weekStart.getTime()) {
      weekStats = {
        weekStart: weekStart.toISOString(),
        completed: 0,
        dailyStats: {}
      };
    }
    
    // 更新统计数据（统一使用分钟作为时间单位）
    todayStats.completed += 1;
    todayStats.focusTime += this.data.focusDuration; // 分钟为单位
    
    const dayKey = todayString;
    weekStats.dailyStats[dayKey] = (weekStats.dailyStats[dayKey] || 0) + 1;
    weekStats.completed += 1;
    
    // 获取或初始化所有日期统计数据
    let allDayStats = wx.getStorageSync('allDayStats') || {};
    if (!allDayStats[dayKey]) {
      allDayStats[dayKey] = {
        date: todayString,
        completed: 0,
        focusTime: 0 // 分钟为单位
      };
    }
    
    // 更新日期统计（分钟为单位）
    allDayStats[dayKey].completed += 1;
    allDayStats[dayKey].focusTime += this.data.focusDuration;
    
    // 保存统计数据
    wx.setStorageSync('todayStats', todayStats);
    wx.setStorageSync('weekStats', weekStats);
    wx.setStorageSync('allDayStats', allDayStats);
    
    // 更新统计信息显示
    this.updateStats();
  },
  
  updateStats: function() {
    const todayStats = wx.getStorageSync('todayStats') || { completed: 0, focusTime: 0 };
    const weekStats = wx.getStorageSync('weekStats') || { completed: 0 };
    
    // focusTime 单位是分钟，转换为小时显示
    const hours = Math.floor(todayStats.focusTime / 60);
    const minutes = todayStats.focusTime % 60;
    const timeDisplay = hours > 0 ? `${hours}.${Math.floor(minutes / 6)}h` : `${minutes}min`;
    
    this.setData({
      todayCompleted: todayStats.completed,
      todayFocusTime: timeDisplay,
      weekCompleted: weekStats.completed
    });
  },

  updateThemeColor: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#009999';
    this.setData({
      themeColor: themeColor
    });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: themeColor
    });
    this.drawProgress(); // 主题色变化时重绘进度
  },

  updateExperience: function(isPerfectFocus) {
    const currentLevel = wx.getStorageSync('userLevel') || 1;

    // 计算获得的经验值
    const focusDuration = this.data.focusDuration;
    let expGained = Math.floor(focusDuration / 5); // 每5分钟获得1经验

    // 连击奖励
    const currentStreak = wx.getStorageSync('currentStreak') || 0;
    if (currentStreak >= 3) {
      expGained = Math.floor(expGained * 1.2); // 连击3天以上获得20%奖励
    }
    if (currentStreak >= 7) {
      expGained = Math.floor(expGained * 1.5); // 连击7天以上获得50%奖励
    }

    // 更新经验值
    const currentExp = wx.getStorageSync('currentExp') || 0;
    const userLevel = wx.getStorageSync('userLevel') || 1;
    const newExp = currentExp + expGained;

    // 检查是否升级
    const nextLevelExp = userLevel * 100;
    if (newExp >= nextLevelExp) {
      const newLevel = userLevel + 1;
      const remainingExp = newExp - nextLevelExp;

      wx.setStorageSync('userLevel', newLevel);
      wx.setStorageSync('currentExp', remainingExp);

      // 显示升级提示
      wx.showModal({
        title: '恭喜升级！',
        content: '您已升级到 Lv.' + newLevel + '！获得了 ' + expGained + ' 经验值',
        showCancel: false,
        confirmText: '太棒了'
      });
    } else {
      wx.setStorageSync('currentExp', newExp);

      // 显示经验值获得提示
      if (expGained > 0) {
        wx.showToast({
          title: '+' + expGained + ' EXP',
          icon: 'none',
          duration: 1500
        });
      }
    }
  },

  // 成就系统
  updateAchievements: function() {
    if (this.data.currentMode !== 'focus') return;

    const self = this;
    const focusDuration = this.data.focusDuration;
    const wasInterrupted = this.data.wasInterrupted;

    // 更新专注次数相关成就
    const totalSessions = (wx.getStorageSync('totalSessions') || 0) + 1;
    wx.setStorageSync('totalSessions', totalSessions);

    // 更新专注时长相关成就
    const totalFocusTime = (wx.getStorageSync('totalFocusTime') || 0) + focusDuration;
    wx.setStorageSync('totalFocusTime', totalFocusTime);

    // 更新连击相关成就
    this.updateStreak();

    // 使用成就追踪器更新成就
    achievementTracker.updateProgress('session_complete', 1, {
      duration: focusDuration,
      interrupted: wasInterrupted,
      timestamp: Date.now()
    });

    achievementTracker.updateProgress('focus_time', totalFocusTime);

    // 更新连击成就
    const currentStreak = wx.getStorageSync('currentStreak') || 0;
    achievementTracker.updateProgress('streak_update', currentStreak);

    // 更新完美专注成就
    if (!wasInterrupted) {
      achievementTracker.updateProgress('perfect_session', 1);
    }

    // 监听成就解锁
    achievementTracker.addListener(function(achievement) {
      self.showAchievementUnlocked(achievement);
    });

    // 检查时间相关成就（保留原有逻辑）
    this.checkTimeBasedAchievements();

    // 检查完美专注成就（保留原有逻辑）
    this.checkPerfectFocusAchievement();
  },

  updateStreak: function() {
    const today = new Date().toDateString();
    const lastFocusDate = wx.getStorageSync('lastFocusDate');
    const currentStreak = wx.getStorageSync('currentStreak') || 0;

    if (lastFocusDate !== today) {
      // 新的一天
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastFocusDate === yesterday.toDateString()) {
        // 连续的一天
        const newStreak = currentStreak + 1;
        wx.setStorageSync('currentStreak', newStreak);

        // 更新最高连击
        const maxStreak = wx.getStorageSync('maxStreak') || 0;
        if (newStreak > maxStreak) {
          wx.setStorageSync('maxStreak', newStreak);
        }
      } else {
        // 中断了连击
        wx.setStorageSync('currentStreak', 1);
      }

      wx.setStorageSync('lastFocusDate', today);
    }
  },

  checkTimeBasedAchievements: function() {
    const now = new Date();
    const hour = now.getHours();

    // 早起鸟儿成就 (6-8点)
    if (hour >= 6 && hour < 8) {
      const earlyBirdCount = (wx.getStorageSync('achievement_early_bird') || 0) + 1;
      wx.setStorageSync('achievement_early_bird', earlyBirdCount);
    }

    // 夜猫子成就 (22-24点)
    if (hour >= 22 && hour < 24) {
      const nightOwlCount = (wx.getStorageSync('achievement_night_owl') || 0) + 1;
      wx.setStorageSync('achievement_night_owl', nightOwlCount);
    }
  },

  checkPerfectFocusAchievement: function() {
    // 这里可以检查是否完整完成了专注时间（没有中途暂停太久等）
    // 简化实现：每次完成专注都算作完美专注
    const perfectCount = (wx.getStorageSync('achievement_perfectionist') || 0) + 1;
    wx.setStorageSync('achievement_perfectionist', perfectCount);
  },

  executeCompletionReminder: function() {
    const self = this;

    // 获取提醒设置
    const vibrateEnabled = wx.getStorageSync('vibrateEnabled') !== false;
    const popupEnabled = wx.getStorageSync('popupEnabled') !== false;
    const repeatIndex = wx.getStorageSync('repeatIndex') || 1;
    const reminderIntervalIndex = wx.getStorageSync('reminderIntervalIndex') || 1;

    // 获取提醒配置
    const repeatOptions = ['1次', '2次', '3次', '5次', '持续提醒'];
    const reminderIntervalOptions = [
      { name: '立即', value: 0 },
      { name: '3秒后', value: 3 },
      { name: '5秒后', value: 5 },
      { name: '10秒后', value: 10 },
      { name: '30秒后', value: 30 }
    ];

    const repeatCount = repeatIndex === 4 ? -1 : parseInt(repeatOptions[repeatIndex].charAt(0)); // -1表示持续提醒
    const intervalSeconds = reminderIntervalOptions[reminderIntervalIndex].value;

    // 延迟执行提醒
    setTimeout(function() {
      self.performReminder(vibrateEnabled, popupEnabled, repeatCount, 0);
    }, intervalSeconds * 1000);
  },

  performReminder: function(vibrateEnabled, popupEnabled, repeatCount, currentCount) {
    const self = this;

    // 震动提醒
    if (vibrateEnabled) {
      this.vibrate();
    }

    // 弹窗提醒
    if (popupEnabled && currentCount === 0) {
      this.showCompletionPopup();
    }

    // 检查是否需要重复提醒
    if (repeatCount === -1) {
      // 持续提醒，每30秒提醒一次，最多提醒10次
      if (currentCount < 10) {
        setTimeout(function() {
          self.performReminder(vibrateEnabled, false, repeatCount, currentCount + 1);
        }, 30000);
      }
    } else if (currentCount + 1 < repeatCount) {
      // 按设定次数重复提醒，间隔3秒
      setTimeout(function() {
        self.performReminder(vibrateEnabled, false, repeatCount, currentCount + 1);
      }, 3000);
    }
  },

  showCompletionPopup: function() {
    const modeText = this.data.currentMode === 'focus' ? '专注' : '休息';

    wx.showModal({
      title: '🎉 ' + modeText + '完成！',
      content: modeText === '专注' ?
        '恭喜你完成了一个专注周期！\n建议适当休息一下，保持良好状态。' :
        '休息时间结束！\n准备好开始下一个专注周期了吗？',
      confirmText: modeText === '专注' ? '开始休息' : '开始专注',
      cancelText: '稍后',
      success: function(res) {
        if (res.confirm) {
          if (modeText === '专注') {
            // 跳转到完成页面或开始休息
            wx.navigateTo({
              url: '/pages/complete/complete?duration=' + this.data.focusDuration + '&completed=' + this.data.todayCompleted
            });
          } else {
            // 开始新的专注周期
            this.switchMode({ currentTarget: { dataset: { mode: 'focus' } } });
          }
        }
      }.bind(this)
    });
  },

  showAchievementUnlocked: function(achievement) {
    // 显示成就解锁提示
    wx.showToast({
      title: '🎉 成就解锁: ' + achievement.title,
      icon: 'success',
      duration: 3000
    });

    // 震动反馈
    wx.vibrateShort && wx.vibrateShort();
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return shareHelper.getShareAppMessageConfig('daily', '/pages/focus/focus');
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('daily');
  },

  /**
   * 触发庆祝动画
   */
  triggerCelebration: function(type) {
    const message = type === 'daily' ? '🎉 恭喜达成今日目标！' : '🏆 恭喜完成本周目标！';
    
    this.setData({
      showCelebration: true
    });
    
    // 震动反馈
    wx.vibrateShort();
    
    // 显示提示
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    });
    
    // 2秒后隐藏动画
    setTimeout(() => {
      this.setData({
        showCelebration: false
      });
    }, 2000);
  },

  /**
   * 跳转到目标设定页面
   */
  goToGoals: function() {
    vibrate.buttonTap();
    wx.navigateTo({
      url: '/pages/goals/goals'
    });
  }

});