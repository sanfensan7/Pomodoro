const MistakeManager = require('../../utils/mistake-manager');
const vibrate = require('../../utils/vibrate');

Page({
  data: {
    themeColor: '#ff6b6b',
    reviewMistakes: [],
    currentIndex: 0,
    currentMistake: null,
    showAnswer: false,
    showExplanation: false,
    userAnswer: '',
    reviewProgress: {
      total: 0,
      current: 0,
      correct: 0,
      wrong: 0
    },
    isCompleted: false,
    loading: true,
    // 科目选择相关
    subjects: [],
    selectedSubject: 'all',
    showSubjectSelector: false
  },

  onLoad: function() {
    this.mistakeManager = new MistakeManager();
    this.loadTheme();
    this.loadSubjects();
    this.loadReviewMistakes();
  },

  loadTheme: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({ themeColor });
  },

  loadSubjects: function() {
    try {
      const subjects = this.mistakeManager.getSubjects();
      // 添加"全部科目"选项
      const subjectsWithAll = [
        { name: 'all', displayName: '全部科目', color: this.data.themeColor },
        ...subjects.map(subject => ({
          ...subject,
          displayName: subject.name
        }))
      ];
      this.setData({ subjects: subjectsWithAll });
    } catch (error) {
      console.error('加载科目失败:', error);
      this.setData({
        subjects: [{ name: 'all', displayName: '全部科目', color: this.data.themeColor }]
      });
    }
  },

  loadReviewMistakes: function() {
    try {
      let reviewMistakes = this.mistakeManager.getMistakesForReview();

      // 按选择的科目筛选
      if (this.data.selectedSubject !== 'all') {
        reviewMistakes = reviewMistakes.filter(mistake =>
          mistake.subject === this.data.selectedSubject
        );
      }

      console.log('获取到的复习错题:', reviewMistakes);

      if (reviewMistakes.length === 0) {
        const subjectText = this.data.selectedSubject === 'all' ? '' : `"${this.data.selectedSubject}"科目`;
        wx.showModal({
          title: '暂无复习内容',
          content: `当前${subjectText}没有需要复习的错题，请先添加一些错题或选择其他科目。`,
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      // 为每个错题添加额外信息
      const processedMistakes = reviewMistakes.map(mistake => {
        // 获取科目信息
        const subjects = this.mistakeManager.getSubjects();
        const subject = subjects.find(s => s.name === mistake.subject);

        return {
          ...mistake,
          subjectColor: subject ? subject.color : '#ff6b6b',
          difficultyText: this.getDifficultyText(mistake.difficulty)
        };
      });

      // 随机打乱顺序
      const shuffled = this.shuffleArray([...processedMistakes]);

      this.setData({
        reviewMistakes: shuffled,
        currentMistake: shuffled[0],
        reviewProgress: {
          total: shuffled.length,
          current: 1,
          correct: 0,
          wrong: 0
        },
        loading: false
      });
    } catch (error) {
      console.error('加载复习错题失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 数组随机打乱
  shuffleArray: function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // 答案输入
  onAnswerInput: function(e) {
    this.setData({ userAnswer: e.detail.value });
  },

  // 显示答案
  showAnswer: function() {
    vibrate.buttonTap();
    this.setData({ showAnswer: true });
  },

  // 显示解析
  showExplanation: function() {
    vibrate.buttonTap();
    this.setData({ showExplanation: true });
  },

  // 提交答案
  submitAnswer: function(e) {
    const isCorrect = e.currentTarget.dataset.correct === 'true';
    const mistakeId = this.data.currentMistake.id;

    // 震动反馈
    if (isCorrect) {
      vibrate.success();
    } else {
      vibrate.warning();
    }

    // 记录复习结果
    this.mistakeManager.recordReview(mistakeId, isCorrect);

    // 更新进度
    const progress = { ...this.data.reviewProgress };
    if (isCorrect) {
      progress.correct++;
    } else {
      progress.wrong++;
    }

    this.setData({
      reviewProgress: progress,
      showAnswer: true,
      showExplanation: true
    });

    // 显示反馈
    wx.showToast({
      title: isCorrect ? '回答正确！' : '继续加油！',
      icon: 'success',
      duration: 1500
    });

    // 延迟进入下一题
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  },

  // 下一题
  nextQuestion: function() {
    vibrate.buttonTap();

    const nextIndex = this.data.currentIndex + 1;

    if (nextIndex >= this.data.reviewMistakes.length) {
      // 复习完成
      this.completeReview();
      return;
    }

    const progress = { ...this.data.reviewProgress };
    progress.current = nextIndex + 1;

    this.setData({
      currentIndex: nextIndex,
      currentMistake: this.data.reviewMistakes[nextIndex],
      reviewProgress: progress,
      showAnswer: false,
      showExplanation: false,
      userAnswer: ''
    });
  },

  // 上一题
  prevQuestion: function() {
    vibrate.buttonTap();

    const prevIndex = this.data.currentIndex - 1;

    if (prevIndex < 0) return;

    const progress = { ...this.data.reviewProgress };
    progress.current = prevIndex + 1;

    this.setData({
      currentIndex: prevIndex,
      currentMistake: this.data.reviewMistakes[prevIndex],
      reviewProgress: progress,
      showAnswer: false,
      showExplanation: false,
      userAnswer: ''
    });
  },

  // 跳过当前题
  skipQuestion: function() {
    vibrate.buttonTap();
    this.nextQuestion();
  },

  // 完成复习
  completeReview: function() {
    const progress = this.data.reviewProgress;
    const accuracy = progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0;

    // 完成震动
    vibrate.complete();

    this.setData({ isCompleted: true });

    // 显示完成统计
    wx.showModal({
      title: '复习完成！',
      content: `本次复习了 ${progress.total} 道题\n正确率：${accuracy}%\n答对：${progress.correct} 题\n答错：${progress.wrong} 题`,
      confirmText: '继续复习',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          // 重新开始复习
          this.restartReview();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  // 重新开始复习
  restartReview: function() {
    this.setData({
      currentIndex: 0,
      showAnswer: false,
      showExplanation: false,
      userAnswer: '',
      isCompleted: false
    });
    this.loadReviewMistakes();
  },

  // 退出复习
  exitReview: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出复习吗？当前进度将不会保存。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 预览图片
  previewImage: function() {
    if (this.data.currentMistake.questionImage) {
      wx.previewImage({
        urls: [this.data.currentMistake.questionImage]
      });
    }
  },

  // 获取进度百分比
  getProgressPercent: function() {
    const progress = this.data.reviewProgress;
    return progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  },

  // 获取难度文本
  getDifficultyText: function(level) {
    const texts = ['', '简单', '一般', '困难', '很难', '极难'];
    return texts[level] || '未知';
  },

  // 退出复习
  exitReview: function() {
    vibrate.buttonTap();

    wx.showModal({
      title: '确认退出',
      content: '确定要退出复习吗？当前进度将不会保存。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 重新开始复习
  restartReview: function() {
    vibrate.buttonTap();

    this.setData({
      currentIndex: 0,
      showAnswer: false,
      showExplanation: false,
      userAnswer: '',
      isCompleted: false
    });
    this.loadReviewMistakes();
  },

  // 预览题目图片
  previewQuestionImage: function() {
    if (this.data.currentMistake && this.data.currentMistake.questionImage) {
      wx.previewImage({
        urls: [this.data.currentMistake.questionImage]
      });
    }
  },

  // 显示科目选择器
  showSubjectSelector: function() {
    vibrate.buttonTap();
    this.setData({ showSubjectSelector: true });
  },

  // 隐藏科目选择器
  hideSubjectSelector: function() {
    this.setData({ showSubjectSelector: false });
  },

  // 选择科目
  selectSubject: function(e) {
    vibrate.buttonTap();
    const subject = e.currentTarget.dataset.subject;

    if (subject === this.data.selectedSubject) {
      this.hideSubjectSelector();
      return;
    }

    this.setData({
      selectedSubject: subject,
      showSubjectSelector: false,
      loading: true,
      currentIndex: 0,
      showAnswer: false,
      showExplanation: false,
      userAnswer: '',
      isCompleted: false
    });

    // 重新加载复习内容
    this.loadReviewMistakes();
  },

  // 预览答案图片
  previewAnswerImage: function() {
    if (this.data.currentMistake && this.data.currentMistake.answerImage) {
      wx.previewImage({
        urls: [this.data.currentMistake.answerImage]
      });
    }
  }

});