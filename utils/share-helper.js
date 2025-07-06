// 分享功能工具模块
function ShareHelper() {
  this.appName = '番茄专注钟';
  this.appDescription = '高效专注学习工具';
}

// 获取用户统计数据
ShareHelper.prototype.getUserStats = function() {
  return {
    totalSessions: wx.getStorageSync('totalSessions') || 0,
    totalFocusTime: wx.getStorageSync('totalFocusTime') || 0,
    currentStreak: wx.getStorageSync('currentStreak') || 0,
    todayCompleted: (wx.getStorageSync('todayStats') || {}).completed || 0,
    todayFocusTime: (wx.getStorageSync('todayStats') || {}).focusTime || 0
  };
};

// 格式化时间显示
ShareHelper.prototype.formatTime = function(minutes) {
  var hours = Math.floor(minutes / 60);
  var mins = minutes % 60;

  if (hours > 0) {
    return hours + ' 小时 ' + mins + ' 分钟';
  } else {
    return mins + ' 分钟';
  }
};

// 生成个性化分享标题
ShareHelper.prototype.generateShareTitle = function(context) {
  var stats = this.getUserStats();

  switch (context) {
    case 'achievement':
      return this.appName + ' - 我的成就解锁了！';

    case 'daily':
      if (stats.todayCompleted > 0) {
        return '今日专注 ' + stats.todayCompleted + ' 次，累计 ' + this.formatTime(stats.todayFocusTime) + '！';
      }
      break;

    case 'streak':
      if (stats.currentStreak > 0) {
        return '我用' + this.appName + '连续专注 ' + stats.currentStreak + ' 天！';
      }
      break;

    case 'total':
      if (stats.totalSessions > 0) {
        var focusHours = Math.floor(stats.totalFocusTime / 60);
        if (focusHours > 0) {
          return '我用' + this.appName + '已专注 ' + focusHours + ' 小时，推荐给你！';
        } else {
          return this.appName + '助我完成 ' + stats.totalSessions + ' 次专注！';
        }
      }
      break;
  }

  return this.appName + ' - ' + this.appDescription;
};

// 生成分享内容
ShareHelper.prototype.generateShareContent = function(includeStats) {
  var content = '🍅 发现了一个超棒的专注学习工具！\n\n';

  if (includeStats) {
    var stats = this.getUserStats();
    if (stats.totalSessions > 0) {
      content += '📊 我的专注成果：\n';
      content += '• 完成专注：' + stats.totalSessions + ' 次\n';
      content += '• 专注时长：' + this.formatTime(stats.totalFocusTime) + '\n';
      if (stats.currentStreak > 0) {
        content += '• 连续专注：' + stats.currentStreak + ' 天\n';
      }
      content += '\n';
    }
  }

  content += '✨ 功能特色：\n';
  content += '• 🎯 番茄工作法计时器\n';
  content += '• 📝 任务管理系统\n';
  content += '• 🏆 成就系统激励\n';
  content += '• 📊 数据统计分析\n';
  content += '• 🎨 多种主题风格\n';
  content += '\n一起来提升专注力，高效学习工作吧！';

  return content;
};

// 显示分享选项菜单
ShareHelper.prototype.showShareMenu = function(options) {
  var self = this;
  var defaultOptions = {
    includeStats: true,
    context: 'total',
    customTitle: null,
    customContent: null,
    path: '/pages/focus/focus'
  };

  var config = Object.assign(defaultOptions, options || {});

  var shareTitle = config.customTitle || this.generateShareTitle(config.context);
  var shareContent = config.customContent || this.generateShareContent(config.includeStats);

  wx.showActionSheet({
    itemList: ['分享给微信好友', '分享到朋友圈', '复制分享内容'],
    success: function(res) {
      switch (res.tapIndex) {
        case 0:
          // 分享给微信好友
          self.shareToFriend(shareTitle, config.path);
          break;
        case 1:
          // 分享到朋友圈
          self.shareToTimeline(shareTitle, config.path);
          break;
        case 2:
          // 复制分享内容
          self.copyShareContent(shareContent);
          break;
      }
    }
  });
};

// 分享给微信好友
ShareHelper.prototype.shareToFriend = function(title, path) {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage']
  });

  // 显示提示
  wx.showToast({
    title: '请点击右上角分享',
    icon: 'none',
    duration: 2000
  });
};

// 分享到朋友圈
ShareHelper.prototype.shareToTimeline = function(title, path) {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareTimeline']
  });

  // 显示提示
  wx.showToast({
    title: '请点击右上角分享',
    icon: 'none',
    duration: 2000
  });
};

// 复制分享内容
ShareHelper.prototype.copyShareContent = function(content) {
  wx.setClipboardData({
    data: content,
    success: function() {
      wx.showToast({
        title: '已复制到剪贴板',
        icon: 'success',
        duration: 2000
      });
    },
    fail: function() {
      wx.showToast({
        title: '复制失败',
        icon: 'none',
        duration: 2000
      });
    }
  });
};

// 生成页面分享配置（给微信好友）
ShareHelper.prototype.getShareAppMessageConfig = function(context, path) {
  var title = this.generateShareTitle(context);
  return {
    title: title,
    path: path || '/pages/focus/focus',
    imageUrl: '' // 可以添加分享图片
  };
};

// 生成页面分享配置（朋友圈）
ShareHelper.prototype.getShareTimelineConfig = function(context) {
  var title = this.generateShareTitle(context);
  return {
    title: title,
    query: '',
    imageUrl: '' // 可以添加分享图片
  };
};

// 创建全局实例
var shareHelper = new ShareHelper();

module.exports = shareHelper;
