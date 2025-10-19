const vibrate = require('./vibrate');

class Timer {
  constructor(page) {
    this.page = page;
    this.timer = null;
  }

  initTimer() {
    // 根据当前模式初始化计时器
    let duration;
    switch (this.page.data.currentMode) {
      case 'focus':
        duration = this.page.data.focusDuration;
        this.page.setData({ timerLabel: this.page.data.currentTask ? this.page.data.currentTask.title : '专注时间' });
        break;
      case 'shortBreak':
        duration = this.page.data.shortBreakDuration;
        this.page.setData({ timerLabel: '短休息' });
        break;
      case 'longBreak':
        duration = this.page.data.longBreakDuration;
        this.page.setData({ timerLabel: '长休息' });
        break;
    }
    
    this.page.setData({
      timeLeft: duration * 60,
      totalTime: duration * 60,
      isRunning: false
    });
    
    this.updateTimerDisplay();
    
    // 延迟绘制进度
    setTimeout(() => {
      this.page.drawProgress && this.page.drawProgress();
    }, 50);
  }

  startTimer() {
    this.page.setData({ isRunning: true });

    // 根据设置决定是否保持屏幕常亮
    var keepScreenOn = wx.getStorageSync('keepScreenOn');
    if (keepScreenOn !== false) { // 默认启用
      wx.setKeepScreenOn({
        keepScreenOn: true
      });
    }

    var self = this;
    let tickCount = 0; // 用于降低Canvas重绘频率
    
    this.timer = setInterval(function() {
      if (self.page.data.timeLeft > 0) {
        self.page.setData({
          timeLeft: self.page.data.timeLeft - 1
        });
        self.updateTimerDisplay();

        // 降低Canvas重绘频率：每5秒重绘一次，而不是每秒
        tickCount++;
        if (tickCount % 5 === 0 && self.page.drawProgress) {
          self.page.drawProgress();
        }
      } else {
        clearInterval(self.timer);
        self.page.setData({ isRunning: false });

        // 取消屏幕常亮
        wx.setKeepScreenOn({
          keepScreenOn: false
        });

        // 计时结束，执行完成提醒
        self.page.executeCompletionReminder();

        // 更新经验值和成就
        self.page.updateExperience();
        self.page.updateAchievements();

        // 计时结束，显示完成页面
        if (self.page.data.currentMode === 'focus') {
          // 使用 FocusStatsManager 记录专注完成
          if (self.page.focusStatsManager) {
            self.page.focusStatsManager.recordFocusSession(
              self.page.data.focusDuration,
              self.page.data.currentTask ? self.page.data.currentTask.id : null
            );
          }
          // 如果有关联任务，更新任务进度
          if (self.page.data.currentTask && self.page.taskManager) {
            self.page.taskManager.updateTaskProgress();
          }

          // 检查是否设置了自动开始休息
          const autoStartBreak = wx.getStorageSync('autoStartBreak');
          if (autoStartBreak) {
            // 判断应该开始短休息还是长休息
            const longBreakInterval = wx.getStorageSync('longBreakInterval') || 4;
            const todayStats = wx.getStorageSync('todayStats') || { completed: 0 };
            
            if (todayStats.completed > 0 && todayStats.completed % longBreakInterval === 0) {
              self.page.switchMode({ currentTarget: { dataset: { mode: 'longBreak' } } });
              self.startTimer(); // 自动开始计时

              wx.showToast({
                title: '已自动开始长休息',
                icon: 'success'
              });
            } else {
              self.page.switchMode({ currentTarget: { dataset: { mode: 'shortBreak' } } });
              self.startTimer(); // 自动开始计时

              wx.showToast({
                title: '已自动开始短休息',
                icon: 'success'
              });
            }
          } else {
            // 如果没有设置自动开始休息，则显示完成页面
            wx.navigateTo({
              url: '/pages/complete/complete'
            });
          }
          
          // 更新统计信息
          self.page.updateCompletedCount();
        } else {
          // 如果是休息结束
          wx.showToast({
            title: '休息结束',
            icon: 'success'
          });

          // 检查是否设置了休息后自动开始专注
          const autoStartFocus = wx.getStorageSync('autoStartFocus');
          if (autoStartFocus) {
            self.page.switchMode({ currentTarget: { dataset: { mode: 'focus' } } });
            self.startTimer(); // 自动开始计时

            wx.showToast({
              title: '已自动开始专注',
              icon: 'success'
            });
          }
        }
      }
    }, 1000);
  }

  pauseTimer() {
    this.page.setData({ isRunning: false });
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  resetTimer() {
    clearInterval(this.timer);

    // 取消屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: false
    });

    this.initTimer();
  }

  toggleTimer() {
    // 震动反馈
    vibrate.buttonTap();

    if (this.page.data.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.page.data.timeLeft / 60);
    const seconds = this.page.data.timeLeft % 60;
    
    this.page.setData({
      timerText: (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    });
  }
}

module.exports = Timer;