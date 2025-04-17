const app = getApp();

Page({
  data: {
    themeColor: '#ff6b6b',
    tasks: [],
    showTaskForm: false,
    newTask: {
      title: '',
      description: '',
      totalCount: 4,
      completedCount: 0
    }
  },

  onLoad: function() {
    // 获取全局主题色
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
    
    // 加载任务列表
    this.loadTasks();
  },
  
  onShow: function() {
    // 如果从设置页返回，可能需要更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
    
    // 刷新任务列表
    this.loadTasks();
  },
  
  loadTasks: function() {
    const tasks = wx.getStorageSync('tasks') || [];
    this.setData({ tasks });
  },
  
  toggleTaskForm: function() {
    this.setData({
      showTaskForm: !this.data.showTaskForm,
      newTask: {
        title: '',
        description: '',
        totalCount: 4,
        completedCount: 0
      }
    });
  },
  
  inputTaskTitle: function(e) {
    this.setData({
      'newTask.title': e.detail.value
    });
  },
  
  inputTaskDescription: function(e) {
    this.setData({
      'newTask.description': e.detail.value
    });
  },
  
  changeTaskCount: function(e) {
    this.setData({
      'newTask.totalCount': e.detail.value
    });
  },
  
  addTask: function() {
    if (!this.data.newTask.title.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      });
      return;
    }
    
    const tasks = this.data.tasks;
    const newTask = {
      id: Date.now().toString(),
      title: this.data.newTask.title,
      description: this.data.newTask.description,
      totalCount: this.data.newTask.totalCount,
      completedCount: 0,
      completed: false,
      createTime: new Date().getTime()
    };
    
    tasks.unshift(newTask);
    
    this.setData({
      tasks: tasks,
      showTaskForm: false
    });
    
    wx.setStorageSync('tasks', tasks);
    
    wx.showToast({
      title: '任务已添加',
      icon: 'success'
    });
  },
  
  toggleTaskStatus: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const tasks = this.data.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed
        };
      }
      return task;
    });
    
    this.setData({ tasks });
    wx.setStorageSync('tasks', tasks);
  },

  startFocus: function(e) {
    const task = e.currentTarget.dataset.task;
    if (task.completedCount >= task.totalCount) {
      wx.showToast({
        title: '该任务已完成所有番茄钟',
        icon: 'none'
      });
      return;
    }

    // 保存当前任务到全局状态
    app.globalData.currentTask = task;
    
    // 切换到专注页面
    wx.switchTab({
      url: '/pages/focus/focus'
    });
  }
}); 