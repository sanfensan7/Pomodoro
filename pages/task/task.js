var app = getApp();
var shareHelper = require('../../utils/share-helper');

Page({
  data: {
    themeColor: '#ff6b6b',
    tasks: [],
    showTaskForm: false,
    showSortMenu: false,
    editingTask: null,
    newTask: {
      title: '',
      description: '',
      totalCount: 4,
      completedCount: 0,
      priority: 'medium',
      category: 'other'
    }
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
    var tasks = wx.getStorageSync('tasks') || [];
    this.setData({ tasks });
  },
  
  toggleTaskForm: function() {
    this.setData({
      showTaskForm: !this.data.showTaskForm,
      showSortMenu: false,
      editingTask: null,
      newTask: {
        title: '',
        description: '',
        totalCount: 4,
        completedCount: 0,
        priority: 'medium',
        category: 'other'
      }
    });
  },

  toggleSortMenu: function() {
    this.setData({
      showSortMenu: !this.data.showSortMenu,
      showTaskForm: false
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

  setPriority: function(e) {
    var priority = e.currentTarget.dataset.priority;
    this.setData({
      'newTask.priority': priority
    });
  },

  setCategory: function(e) {
    var category = e.currentTarget.dataset.category;
    this.setData({
      'newTask.category': category
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

    var tasks = this.data.tasks;
    var newTask = {
      id: Date.now().toString(),
      title: this.data.newTask.title,
      description: this.data.newTask.description,
      totalCount: this.data.newTask.totalCount,
      completedCount: 0,
      completed: false,
      priority: this.data.newTask.priority,
      category: this.data.newTask.category,
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

  editTask: function(e) {
    var task = e.currentTarget.dataset.task;
    this.setData({
      editingTask: task,
      showTaskForm: true,
      newTask: {
        title: task.title,
        description: task.description,
        totalCount: task.totalCount,
        completedCount: task.completedCount,
        priority: task.priority || 'medium',
        category: task.category || 'other'
      }
    });
  },

  updateTask: function() {
    if (!this.data.newTask.title.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      });
      return;
    }

    var self = this;
    var tasks = this.data.tasks.map(function(task) {
      if (task.id === self.data.editingTask.id) {
        return Object.assign({}, task, {
          title: self.data.newTask.title,
          description: self.data.newTask.description,
          totalCount: self.data.newTask.totalCount,
          priority: self.data.newTask.priority,
          category: self.data.newTask.category
        });
      }
      return task;
    });

    this.setData({
      tasks: tasks,
      showTaskForm: false,
      editingTask: null
    });

    wx.setStorageSync('tasks', tasks);

    wx.showToast({
      title: '任务已更新',
      icon: 'success'
    });
  },

  deleteTask: function(e) {
    var taskId = e.currentTarget.dataset.id;
    var self = this;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: function(res) {
        if (res.confirm) {
          var tasks = self.data.tasks.filter(function(task) { return task.id !== taskId; });

          self.setData({ tasks: tasks });
          wx.setStorageSync('tasks', tasks);

          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  sortTasks: function(e) {
    var sortType = e.currentTarget.dataset.type;
    var tasks = this.data.tasks.slice();

    switch (sortType) {
      case 'createTime':
        tasks.sort(function(a, b) { return b.createTime - a.createTime; });
        break;
      case 'priority':
        var priorityOrder = { high: 3, medium: 2, low: 1 };
        tasks.sort(function(a, b) { return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2); });
        break;
      case 'progress':
        tasks.sort(function(a, b) { return (b.completedCount / b.totalCount) - (a.completedCount / a.totalCount); });
        break;
      case 'name':
        tasks.sort(function(a, b) { return a.title.localeCompare(b.title); });
        break;
    }

    this.setData({
      tasks: tasks,
      showSortMenu: false
    });

    wx.setStorageSync('tasks', tasks);
  },
  
  toggleTaskStatus: function(e) {
    var taskId = e.currentTarget.dataset.id;
    var tasks = this.data.tasks.map(function(task) {
      if (task.id === taskId) {
        return Object.assign({}, task, {
          completed: !task.completed
        });
      }
      return task;
    });
    
    this.setData({ tasks });
    wx.setStorageSync('tasks', tasks);
  },

  startFocus: function(e) {
    var task = e.currentTarget.dataset.task;
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
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return shareHelper.getShareAppMessageConfig('total', '/pages/task/task');
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  }
});