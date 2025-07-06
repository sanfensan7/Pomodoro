const app = getApp();

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
    timerStyle: 'circle'
  },

  onLoad: function() {
    // 获取全局主题色
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
    
    // 加载保存的设置
    this.loadSettings();
    
    // 初始化时钟
    this.initTimer();

    // 初始化背景音效
    this.initBackgroundSound();
  },
  
  onShow: function() {
    // 重新加载设置以确保最新设置得到应用
    this.loadSettings();
    
    // 如果从设置页返回，可能需要更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
      this.drawProgressRing();
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
      this.initTimer();
    }
  },
  
  onUnload: function() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }

    // 停止背景音效
    this.stopBackgroundSound();
  },
  
  onReady: function() {
    // 绘制初始进度环
    this.drawProgressRing();
  },
  
  loadSettings: function() {
    const focusDuration = wx.getStorageSync('focusDuration') || 25;
    const shortBreakDuration = wx.getStorageSync('shortBreakDuration') || 5;
    const longBreakDuration = wx.getStorageSync('longBreakDuration') || 15;
    const timerStyle = wx.getStorageSync('timerStyle') || 'circle';
    
    this.setData({
      focusDuration: focusDuration,
      shortBreakDuration: shortBreakDuration,
      longBreakDuration: longBreakDuration,
      timerStyle: timerStyle,
      timeLeft: focusDuration * 60
    });
    
    this.updateTimerDisplay();
  },
  
  initTimer: function() {
    // 根据当前模式初始化计时器
    let duration;
    switch (this.data.currentMode) {
      case 'focus':
        duration = this.data.focusDuration;
        this.setData({ timerLabel: this.data.currentTask ? this.data.currentTask.title : '专注时间' });
        break;
      case 'shortBreak':
        duration = this.data.shortBreakDuration;
        this.setData({ timerLabel: '短休息' });
        break;
      case 'longBreak':
        duration = this.data.longBreakDuration;
        this.setData({ timerLabel: '长休息' });
        break;
    }
    
    this.setData({
      timeLeft: duration * 60,
      totalTime: duration * 60,
      isRunning: false
    });
    
    this.updateTimerDisplay();
    
    // 根据计时器样式选择适当的显示方法
    if (this.data.timerStyle === 'circle') {
      this.drawProgressRing();
    } else if (this.data.timerStyle === 'line') {
      this.drawProgressLine();
    }
    // 极简样式不需要绘制进度
  },
  
  toggleTimer: function() {
    // 播放按钮点击音效
    this.playButtonSound();

    if (this.data.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },
  
  startTimer: function() {
    this.setData({ isRunning: true });

    // 开始播放背景音效
    this.startBackgroundSound();

    var self = this;
    this.timer = setInterval(function() {
      if (self.data.timeLeft > 0) {
        self.setData({
          timeLeft: self.data.timeLeft - 1
        });
        self.updateTimerDisplay();

        // 根据计时器样式更新进度显示
        if (self.data.timerStyle === 'circle') {
          self.drawProgressRing();
        } else if (self.data.timerStyle === 'line') {
          self.drawProgressLine();
        }
      } else {
        clearInterval(self.timer);
        self.setData({ isRunning: false });

        // 停止背景音效
        self.stopBackgroundSound();

        // 计时结束，播放提醒音效和震动
        self.playCompletionSound();
        self.vibrate();

        // 更新经验值和成就
        self.updateExperience();
        self.updateAchievements();

        // 计时结束，显示完成页面
        if (self.data.currentMode === 'focus') {
          // 如果有关联任务，更新任务进度
          if (self.data.currentTask) {
            self.updateTaskProgress();
          }

          // 检查是否设置了自动开始休息
          const autoStartBreak = wx.getStorageSync('autoStartBreak');
          if (autoStartBreak) {
            // 判断应该开始短休息还是长休息
            const longBreakInterval = wx.getStorageSync('longBreakInterval') || 4;
            const todayStats = wx.getStorageSync('todayStats') || { completed: 0 };
            
            if (todayStats.completed > 0 && todayStats.completed % longBreakInterval === 0) {
              self.switchMode({ currentTarget: { dataset: { mode: 'longBreak' } } });
              self.startTimer(); // 自动开始计时

              wx.showToast({
                title: '已自动开始长休息',
                icon: 'success'
              });
            } else {
              self.switchMode({ currentTarget: { dataset: { mode: 'shortBreak' } } });
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
          self.updateCompletedCount();
        } else {
          // 如果是休息结束
          wx.showToast({
            title: '休息结束',
            icon: 'success'
          });

          // 检查是否设置了休息后自动开始专注
          const autoStartFocus = wx.getStorageSync('autoStartFocus');
          if (autoStartFocus) {
            self.switchMode({ currentTarget: { dataset: { mode: 'focus' } } });
            self.startTimer(); // 自动开始计时

            wx.showToast({
              title: '已自动开始专注',
              icon: 'success'
            });
          }
        }
      }
    }, 1000);
  },
  
  pauseTimer: function() {
    clearInterval(this.timer);
    this.setData({ isRunning: false });

    // 暂停背景音效
    this.pauseBackgroundSound();
  },
  
  resetTimer: function() {
    clearInterval(this.timer);
    this.initTimer();
  },
  
  updateTimerDisplay: function() {
    const minutes = Math.floor(this.data.timeLeft / 60);
    const seconds = this.data.timeLeft % 60;
    
    this.setData({
      timerText: (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    });
  },
  
  drawProgressRing: function() {
    const query = wx.createSelectorQuery();
    var self = this;
    query.select('#progressRing')
      .fields({ node: true, size: true })
      .exec(function(res) {
        // 如果不是环形样式，不执行绘制
        if (self.data.timerStyle !== 'circle' || !res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        const systemInfo = wx.getWindowInfo();
        const dpr = systemInfo.pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制进度环
        const centerX = res[0].width / 2;
        const centerY = res[0].height / 2;
        const radius = res[0].width * 0.45;
        
        // 计算进度
        const progress = (self.data.totalTime - self.data.timeLeft) / self.data.totalTime;
        const startAngle = -0.5 * Math.PI; // 从顶部开始
        const endAngle = startAngle + (2 * Math.PI * progress);

        // 绘制圆环底色
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 12;
        ctx.stroke();

        // 绘制进度弧
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = self.data.themeColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
  },
  
  drawProgressLine: function() {
    const query = wx.createSelectorQuery();
    var self = this;
    query.select('#progressLine')
      .fields({ node: true, size: true })
      .exec(function(res) {
        // 如果不是直线样式或未找到元素，不执行绘制
        if (self.data.timerStyle !== 'line' || !res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        const systemInfo = wx.getWindowInfo();
        const dpr = systemInfo.pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 设置线条属性
        const width = res[0].width;
        const height = res[0].height;
        const lineHeight = 10; // 线条高度
        const y = height / 2 - lineHeight / 2; // 线条Y轴位置
        
        // 计算进度
        const progress = (self.data.totalTime - self.data.timeLeft) / self.data.totalTime;
        const progressWidth = width * progress;

        // 绘制背景线
        ctx.beginPath();
        ctx.rect(0, y, width, lineHeight);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();

        // 绘制进度线
        ctx.beginPath();
        ctx.rect(0, y, progressWidth, lineHeight);
        ctx.fillStyle = self.data.themeColor;
        ctx.fill();
      });
  },
  
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    
    this.setData({
      currentMode: mode
    });
    
    clearInterval(this.timer);
    this.initTimer();
  },
  
  updateTaskProgress: function() {
    if (!this.data.currentTask) return;

    const tasks = wx.getStorageSync('tasks') || [];
    const updatedTasks = tasks.map(function(task) {
      if (task.id === this.data.currentTask.id) {
        const completedCount = task.completedCount + 1;
        const completed = completedCount >= task.totalCount;
        return Object.assign({}, task, {
          completedCount: completedCount,
          completed: completed
        });
      }
      return task;
    });

    wx.setStorageSync('tasks', updatedTasks);
    
    // 更新全局状态和当前页面状态
    const updatedTask = updatedTasks.find(function(task) { return task.id === this.data.currentTask.id; }.bind(this));
    app.globalData.currentTask = updatedTask;
    this.setData({
      currentTask: updatedTask
    });

    // 如果任务已完成，显示提示
    if (updatedTask.completed) {
      wx.showToast({
        title: '任务已完成！',
        icon: 'success'
      });
      // 清除当前任务
      var self = this;
      setTimeout(function() {
        app.globalData.currentTask = null;
        self.setData({
          currentTask: null
        });
      }, 2000);
    }
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
    
    // 更新统计数据
    todayStats.completed += 1;
    todayStats.focusTime += this.data.focusDuration / 60; // 小时为单位
    
    const dayKey = todayString;
    weekStats.dailyStats[dayKey] = (weekStats.dailyStats[dayKey] || 0) + 1;
    weekStats.completed += 1;
    
    // 获取或初始化所有日期统计数据
    let allDayStats = wx.getStorageSync('allDayStats') || {};
    if (!allDayStats[dayKey]) {
      allDayStats[dayKey] = {
        date: todayString,
        completed: 0,
        focusTime: 0
      };
    }
    
    // 更新日期统计
    allDayStats[dayKey].completed += 1;
    allDayStats[dayKey].focusTime += this.data.focusDuration / 60;
    
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
    
    this.setData({
      todayCompleted: todayStats.completed,
      todayFocusTime: todayStats.focusTime.toFixed(1) + 'h',
      weekCompleted: weekStats.completed
    });
  },
  
  navigateToSettings: function() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  updateThemeColor: function(color) {
    // 更新CSS变量
    wx.getSystemInfo({
      success: function() {
        const page = this.selectComponent('.container');
        if (page && page.setStyle) {
          page.setStyle({
            '--theme-color': color
          });
        } else {
          // 如果无法直接设置组件样式，则更新页面根节点
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          if (currentPage) {
            const pageEl = currentPage.selectComponent('.container');
            if (pageEl) {
              pageEl.setStyle({
                '--theme-color': color
              });
            }
          }
        }
      }
    });
  },

  // 音效和震动功能
  playButtonSound: function() {
    // 检查是否开启音效
    const soundEnabled = wx.getStorageSync('soundEnabled');
    if (soundEnabled === false) return;

    try {
      // 使用轻微震动作为按钮反馈
      wx.vibrateShort && wx.vibrateShort({
        type: 'light'
      });
    } catch (e) {
      console.log('按钮反馈失败:', e);
    }
  },

  playCompletionSound: function() {
    // 检查是否开启音效
    const soundEnabled = wx.getStorageSync('soundEnabled');
    if (soundEnabled === false) return;

    try {
      // 使用系统提示音
      wx.showToast({
        title: '专注完成！',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.log('完成音效播放失败:', e);
    }
  },

  vibrate: function() {
    // 检查是否开启震动
    const vibrateEnabled = wx.getStorageSync('vibrateEnabled');
    if (vibrateEnabled === false) return;

    try {
      // 长震动提醒
      wx.vibrateLong && wx.vibrateLong({
        success: function() {
          console.log('震动提醒成功');
        },
        fail: function() {
          console.log('震动提醒失败');
        }
      });
    } catch (e) {
      console.log('震动功能不可用:', e);
    }
  },

  // 背景音效管理
  initBackgroundSound: function() {
    const backgroundSound = wx.getStorageSync('backgroundSound') || 'none';
    const soundVolume = wx.getStorageSync('soundVolume') || 50;

    this.backgroundSoundId = backgroundSound;
    this.soundVolume = soundVolume / 100;
  },

  startBackgroundSound: function() {
    if (this.backgroundSoundId === 'none') return;

    try {
      // 创建背景音频上下文
      if (!this.backgroundAudio) {
        this.backgroundAudio = wx.createInnerAudioContext();
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = this.soundVolume;

        // 这里可以设置不同音效的音频文件路径
        // 由于小程序限制，我们使用模拟的方式
        this.backgroundAudio.src = this.getSoundUrl(this.backgroundSoundId);
      }

      this.backgroundAudio.play();
      console.log('开始播放背景音效:', this.backgroundSoundId);

    } catch (e) {
      console.log('背景音效播放失败:', e);
    }
  },

  pauseBackgroundSound: function() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }
  },

  stopBackgroundSound: function() {
    if (this.backgroundAudio) {
      this.backgroundAudio.stop();
      this.backgroundAudio.destroy();
      this.backgroundAudio = null;
    }
  },

  getSoundUrl: function(soundId) {
    // 这里返回对应音效的URL
    // 在实际应用中，可以将音频文件放在云存储或CDN上
    const soundUrls = {
      'rain': '/audio/rain.mp3',
      'ocean': '/audio/ocean.mp3',
      'forest': '/audio/forest.mp3',
      'cafe': '/audio/cafe.mp3',
      'fireplace': '/audio/fireplace.mp3',
      'whitenoise': '/audio/whitenoise.mp3',
      'pinknoise': '/audio/pinknoise.mp3'
    };

    return soundUrls[soundId] || '';
  },

  // 经验值系统
  updateExperience: function() {
    if (this.data.currentMode !== 'focus') return;

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

    // 更新专注次数相关成就
    const totalSessions = (wx.getStorageSync('totalSessions') || 0) + 1;
    wx.setStorageSync('totalSessions', totalSessions);

    // 更新专注时长相关成就
    const totalFocusTime = (wx.getStorageSync('totalFocusTime') || 0) + this.data.focusDuration;
    wx.setStorageSync('totalFocusTime', totalFocusTime);

    // 更新连击相关成就
    this.updateStreak();

    // 检查时间相关成就
    this.checkTimeBasedAchievements();

    // 检查完美专注成就
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
  }
});