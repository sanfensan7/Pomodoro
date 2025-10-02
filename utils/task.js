const app = getApp();

class Task {
  constructor(page) {
    this.page = page;
  }

  updateTaskProgress() {
    if (!this.page.data.currentTask) return;

    const tasks = wx.getStorageSync('tasks') || [];
    const updatedTasks = tasks.map((task) => {
      if (task.id === this.page.data.currentTask.id) {
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
    const updatedTask = updatedTasks.find((task) => { return task.id === this.page.data.currentTask.id; });
    app.globalData.currentTask = updatedTask;
    this.page.setData({
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
        this.page.setData({
          currentTask: null
        });
      }, 2000);
    }
  }
}

module.exports = Task;