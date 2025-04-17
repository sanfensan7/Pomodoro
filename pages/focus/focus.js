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
    if (this.data.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },
  
  startTimer: function() {
    this.setData({ isRunning: true });
    
    this.timer = setInterval(() => {
      if (this.data.timeLeft > 0) {
        this.setData({
          timeLeft: this.data.timeLeft - 1
        });
        this.updateTimerDisplay();
        
        // 根据计时器样式更新进度显示
        if (this.data.timerStyle === 'circle') {
          this.drawProgressRing();
        } else if (this.data.timerStyle === 'line') {
          this.drawProgressLine();
        }
      } else {
        clearInterval(this.timer);
        this.setData({ isRunning: false });
        
        // 计时结束，显示完成页面
        if (this.data.currentMode === 'focus') {
          // 如果有关联任务，更新任务进度
          if (this.data.currentTask) {
            this.updateTaskProgress();
          }

          // 检查是否设置了自动开始休息
          const autoStartBreak = wx.getStorageSync('autoStartBreak');
          if (autoStartBreak) {
            // 判断应该开始短休息还是长休息
            const longBreakInterval = wx.getStorageSync('longBreakInterval') || 4;
            const todayStats = wx.getStorageSync('todayStats') || { completed: 0 };
            
            if (todayStats.completed > 0 && todayStats.completed % longBreakInterval === 0) {
              this.switchMode({ currentTarget: { dataset: { mode: 'longBreak' } } });
              this.startTimer(); // 自动开始计时
              
              wx.showToast({
                title: '已自动开始长休息',
                icon: 'success'
              });
            } else {
              this.switchMode({ currentTarget: { dataset: { mode: 'shortBreak' } } });
              this.startTimer(); // 自动开始计时
              
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
          this.updateCompletedCount();
        } else {
          // 如果是休息结束
          wx.showToast({
            title: '休息结束',
            icon: 'success'
          });
          
          // 检查是否设置了休息后自动开始专注
          const autoStartFocus = wx.getStorageSync('autoStartFocus');
          if (autoStartFocus) {
            this.switchMode({ currentTarget: { dataset: { mode: 'focus' } } });
            this.startTimer(); // 自动开始计时
            
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
  },
  
  resetTimer: function() {
    clearInterval(this.timer);
    this.initTimer();
  },
  
  updateTimerDisplay: function() {
    const minutes = Math.floor(this.data.timeLeft / 60);
    const seconds = this.data.timeLeft % 60;
    
    this.setData({
      timerText: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    });
  },
  
  drawProgressRing: function() {
    const query = wx.createSelectorQuery();
    query.select('#progressRing')
      .fields({ node: true, size: true })
      .exec((res) => {
        // 如果不是环形样式，不执行绘制
        if (this.data.timerStyle !== 'circle' || !res[0]) return;
        
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
        const progress = (this.data.totalTime - this.data.timeLeft) / this.data.totalTime;
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
        ctx.strokeStyle = this.data.themeColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
  },
  
  drawProgressLine: function() {
    const query = wx.createSelectorQuery();
    query.select('#progressLine')
      .fields({ node: true, size: true })
      .exec((res) => {
        // 如果不是直线样式或未找到元素，不执行绘制
        if (this.data.timerStyle !== 'line' || !res[0]) return;
        
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
        const progress = (this.data.totalTime - this.data.timeLeft) / this.data.totalTime;
        const progressWidth = width * progress;
        
        // 绘制背景线
        ctx.beginPath();
        ctx.rect(0, y, width, lineHeight);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        
        // 绘制进度线
        ctx.beginPath();
        ctx.rect(0, y, progressWidth, lineHeight);
        ctx.fillStyle = this.data.themeColor;
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
    const updatedTasks = tasks.map(task => {
      if (task.id === this.data.currentTask.id) {
        const completedCount = task.completedCount + 1;
        const completed = completedCount >= task.totalCount;
        return {
          ...task,
          completedCount,
          completed
        };
      }
      return task;
    });

    wx.setStorageSync('tasks', updatedTasks);
    
    // 更新全局状态和当前页面状态
    const updatedTask = updatedTasks.find(task => task.id === this.data.currentTask.id);
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
      setTimeout(() => {
        app.globalData.currentTask = null;
        this.setData({
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
      success: (res) => {
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
  }
}); 