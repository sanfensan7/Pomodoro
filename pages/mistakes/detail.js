const MistakeManager = require('../../utils/mistake-manager');

Page({
  data: {
    themeColor: '#ff6b6b',
    mistake: null,
    mistakeId: '',
    showAnswer: false,
    showExplanation: false,
    reviewMode: false,
    userAnswer: '',
    loading: true
  },

  onLoad: function(options) {
    this.mistakeManager = new MistakeManager();
    this.loadTheme();

    if (options.id) {
      this.setData({ mistakeId: options.id });
      this.loadMistakeDetail(options.id);
    }

    // 检查是否是复习模式
    if (options.review === 'true') {
      this.setData({ reviewMode: true });
    }
  },

  loadTheme: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({ themeColor });
  },

  loadMistakeDetail: function(mistakeId) {
    const mistake = this.mistakeManager.getMistakeById(mistakeId);
    if (mistake) {
      // 获取科目颜色
      const subjects = this.mistakeManager.getSubjects();
      const subject = subjects.find(s => s.name === mistake.subject);
      mistake.subjectColor = subject ? subject.color : this.data.themeColor;

      this.setData({
        mistake,
        loading: false
      });
    } else {
      wx.showToast({
        title: '错题不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 显示/隐藏答案
  toggleAnswer: function() {
    this.setData({ showAnswer: !this.data.showAnswer });
  },

  // 显示/隐藏解析
  toggleExplanation: function() {
    this.setData({ showExplanation: !this.data.showExplanation });
  },

  // 复习模式下的答案输入
  onAnswerInput: function(e) {
    this.setData({ userAnswer: e.detail.value });
  },

  // 提交复习答案
  submitReview: function(isCorrect) {
    const mistakeId = this.data.mistakeId;

    if (this.mistakeManager.recordReview(mistakeId, isCorrect)) {
      wx.showToast({
        title: isCorrect ? '回答正确！' : '继续加油！',
        icon: 'success'
      });

      // 更新错题数据
      this.loadMistakeDetail(mistakeId);

      // 显示答案和解析
      this.setData({
        showAnswer: true,
        showExplanation: true
      });

      // 如果是复习模式，延迟返回
      if (this.data.reviewMode) {
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } else {
      wx.showToast({
        title: '记录失败',
        icon: 'error'
      });
    }
  },

  // 切换收藏状态
  toggleStar: function() {
    const mistake = this.data.mistake;
    const newStarred = !mistake.isStarred;

    if (this.mistakeManager.updateMistake(mistake.id, { isStarred: newStarred })) {
      this.setData({
        'mistake.isStarred': newStarred
      });
      wx.showToast({
        title: newStarred ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    }
  },

  // 编辑错题
  editMistake: function() {
    wx.navigateTo({
      url: `/pages/mistakes/edit?id=${this.data.mistakeId}`
    });
  },

  // 删除错题
  deleteMistake: function() {
    const self = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？删除后无法恢复。',
      success: function(res) {
        if (res.confirm) {
          if (self.mistakeManager.deleteMistake(self.data.mistakeId)) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 预览图片
  previewImage: function() {
    if (this.data.mistake.questionImage) {
      wx.previewImage({
        urls: [this.data.mistake.questionImage]
      });
    }
  },

  // 分享错题
  shareMistake: function() {
    const mistake = this.data.mistake;
    const shareText = `【错题分享】\n科目：${mistake.subject}\n题目：${mistake.question.substring(0, 50)}${mistake.question.length > 50 ? '...' : ''}`;

    wx.setClipboardData({
      data: shareText,
      success: function() {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 格式化时间显示
  formatTime: function(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().substring(0, 5);
  },

  // 获取掌握程度文字
  getMasteryText: function(level) {
    const texts = ['', '初学', '了解', '熟悉', '掌握', '精通'];
    return texts[level] || '未知';
  },

  // 获取掌握程度颜色
  getMasteryColor: function(level) {
    const colors = ['', '#ff6b6b', '#ffa726', '#ffca28', '#66bb6a', '#4caf50'];
    return colors[level] || '#999';
  },

  // 获取下次复习时间文字
  getNextReviewText: function(timeStr) {
    if (!timeStr) return '无需复习';

    const reviewTime = new Date(timeStr);
    const now = new Date();
    const diffDays = Math.ceil((reviewTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return '需要复习';
    if (diffDays === 1) return '明天复习';
    if (diffDays < 7) return `${diffDays}天后复习`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周后复习`;
    return `${Math.ceil(diffDays / 30)}个月后复习`;
  }
});