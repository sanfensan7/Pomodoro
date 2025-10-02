const MistakeManager = require('../../utils/mistake-manager');
const vibrate = require('../../utils/vibrate');
const logger = require('../../utils/logger');
const perfMonitor = require('../../utils/performance-monitor');
const imageCompressor = require('../../utils/image-compressor');

Page({
  data: {
    themeColor: '#ff6b6b',
    isEdit: false,
    mistakeId: '',
    inputMode: 'text', // 'text' 或 'image'
    formData: {
      subject: '',
      chapter: '',
      knowledgePoint: '',
      question: '',
      questionImage: '',
      answerImage: '',
      myAnswer: '',
      correctAnswer: '',
      explanation: '',
      difficulty: 3,
      tags: []
    },
    subjects: [],
    chapters: [],
    selectedSubjectIndex: 0,
    selectedChapterIndex: 0,
    difficultyOptions: [
      { value: 1, label: '很简单' },
      { value: 2, label: '简单' },
      { value: 3, label: '中等' },
      { value: 4, label: '困难' },
      { value: 5, label: '很困难' }
    ],
    tagInput: '',
    showTagInput: false,
    submitting: false
  },

  onLoad: function(options) {
    this.mistakeManager = new MistakeManager();
    this.loadTheme();
    this.loadSubjects();
    
    if (options.id) {
      // 编辑模式
      this.setData({ 
        isEdit: true, 
        mistakeId: options.id 
      });
      this.loadMistakeData(options.id);
    } else {
      // 新增模式
      this.initDefaultData();
    }
  },

  loadTheme: function() {
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({ themeColor });
  },

  loadSubjects: function() {
    const subjects = this.mistakeManager.getSubjects();
    this.setData({ subjects });
    
    if (subjects.length > 0 && !this.data.isEdit) {
      this.setData({
        'formData.subject': subjects[0].name,
        chapters: subjects[0].chapters || []
      });
    }
  },

  loadMistakeData: function(mistakeId) {
    const mistake = this.mistakeManager.getMistakeById(mistakeId);
    if (mistake) {
      // 找到对应的科目索引
      const subjectIndex = this.data.subjects.findIndex(s => s.name === mistake.subject);
      const subject = this.data.subjects[subjectIndex] || this.data.subjects[0];
      const chapterIndex = subject.chapters.findIndex(c => c === mistake.chapter);

      this.setData({
        formData: {
          subject: mistake.subject,
          chapter: mistake.chapter,
          knowledgePoint: mistake.knowledgePoint,
          question: mistake.question,
          questionImage: mistake.questionImage,
          myAnswer: mistake.myAnswer,
          correctAnswer: mistake.correctAnswer,
          explanation: mistake.explanation,
          difficulty: mistake.difficulty,
          tags: mistake.tags || []
        },
        selectedSubjectIndex: Math.max(0, subjectIndex),
        selectedChapterIndex: Math.max(0, chapterIndex),
        chapters: subject.chapters || []
      });
    }
  },

  initDefaultData: function() {
    if (this.data.subjects.length > 0) {
      const firstSubject = this.data.subjects[0];
      this.setData({
        'formData.subject': firstSubject.name,
        chapters: firstSubject.chapters || []
      });
      
      if (firstSubject.chapters && firstSubject.chapters.length > 0) {
        this.setData({
          'formData.chapter': firstSubject.chapters[0]
        });
      }
    }
  },

  // 选择科目
  onSubjectChange: function(e) {
    const index = parseInt(e.detail.value);
    const subject = this.data.subjects[index];
    
    this.setData({
      selectedSubjectIndex: index,
      selectedChapterIndex: 0,
      'formData.subject': subject.name,
      'formData.chapter': subject.chapters[0] || '',
      chapters: subject.chapters || []
    });
  },

  // 选择章节
  onChapterChange: function(e) {
    const index = parseInt(e.detail.value);
    const chapter = this.data.chapters[index];
    
    this.setData({
      selectedChapterIndex: index,
      'formData.chapter': chapter
    });
  },

  // 输入框变化
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 难度选择
  onDifficultyChange: function(e) {
    const difficulty = parseInt(e.currentTarget.dataset.difficulty);
    this.setData({
      'formData.difficulty': difficulty
    });
  },

  // 切换输入模式
  switchInputMode: function() {
    vibrate.buttonTap();

    const newMode = this.data.inputMode === 'text' ? 'image' : 'text';
    this.setData({ inputMode: newMode });

    wx.showToast({
      title: newMode === 'image' ? '已切换到图片模式' : '已切换到文字模式',
      icon: 'success',
      duration: 1500
    });
  },

  // 选择题目图片
  chooseQuestionImage: async function() {
    vibrate.buttonTap();
    const tracker = perfMonitor.trackImageLoad('question-image-upload');

    try {
      logger.log('开始选择题目图片');
      
      // 使用图片压缩器选择并压缩图片
      const result = await imageCompressor.chooseAndCompress({
        count: 1,
        sourceType: ['album', 'camera'],
        ...imageCompressor.getRecommendedConfig('mistake')
      });

      if (result.tempFilePaths && result.tempFilePaths.length > 0) {
        const compressedPath = result.tempFilePaths[0];
        
        this.setData({
          'formData.questionImage': compressedPath
        });

        logger.log('题目图片已添加并压缩');
        wx.showToast({
          title: '图片已添加',
          icon: 'success'
        });
        
        tracker.end({ success: true });
      }
    } catch (err) {
      logger.error('选择题目图片失败', err);
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
      tracker.end({ error: true });
    }
  },

  // 选择答案图片
  chooseAnswerImage: async function() {
    vibrate.buttonTap();
    const tracker = perfMonitor.trackImageLoad('answer-image-upload');

    try {
      logger.log('开始选择答案图片');
      
      // 使用图片压缩器选择并压缩图片
      const result = await imageCompressor.chooseAndCompress({
        count: 1,
        sourceType: ['album', 'camera'],
        ...imageCompressor.getRecommendedConfig('mistake')
      });

      if (result.tempFilePaths && result.tempFilePaths.length > 0) {
        const compressedPath = result.tempFilePaths[0];
        
        this.setData({
          'formData.answerImage': compressedPath
        });

        logger.log('答案图片已添加并压缩');
        wx.showToast({
          title: '图片已添加',
          icon: 'success'
        });
        
        tracker.end({ success: true });
      }
    } catch (err) {
      logger.error('选择答案图片失败', err);
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
      tracker.end({ error: true });
    }
  },

  // 删除题目图片
  removeQuestionImage: function() {
    vibrate.buttonTap();

    wx.showModal({
      title: '确认删除',
      content: '确定要删除题目图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'formData.questionImage': ''
          });
        }
      }
    });
  },

  // 删除答案图片
  removeAnswerImage: function() {
    vibrate.buttonTap();

    wx.showModal({
      title: '确认删除',
      content: '确定要删除答案图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'formData.answerImage': ''
          });
        }
      }
    });
  },

  // 预览题目图片
  previewQuestionImage: function() {
    if (this.data.formData.questionImage) {
      wx.previewImage({
        urls: [this.data.formData.questionImage]
      });
    }
  },

  // 预览答案图片
  previewAnswerImage: function() {
    if (this.data.formData.answerImage) {
      wx.previewImage({
        urls: [this.data.formData.answerImage]
      });
    }
  },

  // 显示标签输入
  showTagInput: function() {
    this.setData({ showTagInput: true });
  },

  // 标签输入变化
  onTagInput: function(e) {
    this.setData({ tagInput: e.detail.value });
  },

  // 添加标签
  addTag: function() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;

    const tags = [...this.data.formData.tags];
    if (!tags.includes(tag)) {
      tags.push(tag);
      this.setData({
        'formData.tags': tags,
        tagInput: '',
        showTagInput: false
      });
    } else {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
    }
  },

  // 删除标签
  removeTag: function(e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.formData.tags];
    tags.splice(index, 1);
    this.setData({
      'formData.tags': tags
    });
  },

  // 取消标签输入
  cancelTagInput: function() {
    this.setData({
      showTagInput: false,
      tagInput: ''
    });
  },

  // 表单验证
  validateForm: function() {
    const { question, questionImage, correctAnswer, answerImage, subject } = this.data.formData;
    const { inputMode } = this.data;

    // 检查科目
    if (!subject.trim()) {
      wx.showToast({
        title: '请选择科目',
        icon: 'none'
      });
      return false;
    }

    if (inputMode === 'image') {
      // 图片模式：至少需要题目图片或答案图片
      if (!questionImage && !answerImage) {
        wx.showToast({
          title: '请至少上传题目图片或答案图片',
          icon: 'none'
        });
        return false;
      }

      // 如果只有答案图片，建议也上传题目图片
      if (!questionImage && answerImage) {
        return new Promise((resolve) => {
          wx.showModal({
            title: '提示',
            content: '建议同时上传题目图片，这样复习时更完整。确定只保存答案图片吗？',
            success: (res) => {
              resolve(res.confirm);
            },
            fail: () => {
              resolve(false);
            }
          });
        });
      }
    } else {
      // 文字模式：需要题目内容和正确答案
      if (!question.trim()) {
        wx.showToast({
          title: '请输入题目内容',
          icon: 'none'
        });
        return false;
      }

      if (!correctAnswer.trim()) {
        wx.showToast({
          title: '请输入正确答案',
          icon: 'none'
        });
        return false;
      }
    }

    return true;
  },

  // 保存错题
  saveMistake: async function() {
    if (this.data.submitting) return;

    vibrate.buttonTap();

    // 验证表单
    const validationResult = this.validateForm();
    if (validationResult instanceof Promise) {
      const isValid = await validationResult;
      if (!isValid) return;
    } else if (!validationResult) {
      return;
    }

    this.setData({ submitting: true });

    try {
      const formData = { ...this.data.formData };

      // 图片模式下，如果没有文字内容，设置默认值
      if (this.data.inputMode === 'image') {
        if (!formData.question.trim() && formData.questionImage) {
          formData.question = '图片题目';
        }
        if (!formData.correctAnswer.trim() && formData.answerImage) {
          formData.correctAnswer = '见图片答案';
        }
      }

      let success = false;

      if (this.data.isEdit) {
        // 更新错题
        success = this.mistakeManager.updateMistake(this.data.mistakeId, formData);
      } else {
        // 添加新错题
        const newMistake = this.mistakeManager.addMistake(formData);
        success = !!newMistake;
      }

      if (success) {
        // 成功震动
        vibrate.success();

        wx.showToast({
          title: this.data.isEdit ? '更新成功' : '添加成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // 失败震动
        vibrate.error();

        wx.showToast({
          title: this.data.isEdit ? '更新失败' : '添加失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('保存错题失败:', error);
      vibrate.error();

      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 预览图片
  previewImage: function() {
    if (this.data.formData.questionImage) {
      wx.previewImage({
        urls: [this.data.formData.questionImage]
      });
    }
  },

  // 重置表单
  resetForm: function() {
    vibrate.buttonTap();

    const self = this;
    wx.showModal({
      title: '确认重置',
      content: '确定要重置表单吗？所有输入的内容将被清空。',
      success: function(res) {
        if (res.confirm) {
          if (self.data.isEdit) {
            self.loadMistakeData(self.data.mistakeId);
          } else {
            self.setData({
              formData: {
                subject: self.data.subjects[0]?.name || '',
                chapter: self.data.subjects[0]?.chapters[0] || '',
                knowledgePoint: '',
                question: '',
                questionImage: '',
                myAnswer: '',
                correctAnswer: '',
                explanation: '',
                difficulty: 3,
                tags: []
              },
              selectedSubjectIndex: 0,
              selectedChapterIndex: 0,
              tagInput: '',
              showTagInput: false
            });
          }
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  }
});
