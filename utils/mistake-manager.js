// 错题管理工具类
class MistakeManager {
  constructor() {
    this.storageKey = 'mistakes';
    this.subjectsKey = 'mistakeSubjects';
    this.statsKey = 'mistakeStats';
  }

  // 获取所有错题
  getAllMistakes() {
    try {
      return wx.getStorageSync(this.storageKey) || [];
    } catch (e) {
      console.error('Failed to load mistakes:', e);
      return [];
    }
  }

  // 保存错题
  saveMistakes(mistakes) {
    try {
      wx.setStorageSync(this.storageKey, mistakes);
      this.updateStats();
      return true;
    } catch (e) {
      console.error('Failed to save mistakes:', e);
      return false;
    }
  }

  // 添加新错题
  addMistake(mistakeData) {
    const mistakes = this.getAllMistakes();
    const newMistake = {
      id: this.generateId(),
      subject: mistakeData.subject || '未分类',
      chapter: mistakeData.chapter || '',
      knowledgePoint: mistakeData.knowledgePoint || '',
      question: mistakeData.question || '',
      questionImage: mistakeData.questionImage || '',
      answerImage: mistakeData.answerImage || '',
      myAnswer: mistakeData.myAnswer || '',
      correctAnswer: mistakeData.correctAnswer || '',
      explanation: mistakeData.explanation || '',
      difficulty: mistakeData.difficulty || 3,
      tags: mistakeData.tags || [],
      createTime: new Date().toISOString(),
      reviewTimes: 0,
      lastReviewTime: null,
      nextReviewTime: this.calculateNextReviewTime(0),
      masteryLevel: 1, // 1-5掌握程度
      isStarred: false,
      reviewHistory: []
    };

    mistakes.push(newMistake);
    return this.saveMistakes(mistakes) ? newMistake : null;
  }

  // 更新错题
  updateMistake(mistakeId, updateData) {
    const mistakes = this.getAllMistakes();
    const index = mistakes.findIndex(m => m.id === mistakeId);
    
    if (index === -1) return false;

    mistakes[index] = { ...mistakes[index], ...updateData };
    return this.saveMistakes(mistakes);
  }

  // 删除错题
  deleteMistake(mistakeId) {
    const mistakes = this.getAllMistakes();
    const filteredMistakes = mistakes.filter(m => m.id !== mistakeId);
    return this.saveMistakes(filteredMistakes);
  }

  // 获取单个错题
  getMistakeById(mistakeId) {
    const mistakes = this.getAllMistakes();
    return mistakes.find(m => m.id === mistakeId) || null;
  }

  // 按科目筛选错题
  getMistakesBySubject(subject) {
    const mistakes = this.getAllMistakes();
    return mistakes.filter(m => m.subject === subject);
  }

  // 按掌握程度筛选
  getMistakesByMastery(masteryLevel) {
    const mistakes = this.getAllMistakes();
    return mistakes.filter(m => m.masteryLevel === masteryLevel);
  }

  // 获取需要复习的错题
  getMistakesForReview() {
    const mistakes = this.getAllMistakes();
    const now = new Date().toISOString();
    return mistakes.filter(m => m.nextReviewTime <= now);
  }

  // 记录复习结果
  recordReview(mistakeId, isCorrect) {
    const mistake = this.getMistakeById(mistakeId);
    if (!mistake) return false;

    const now = new Date().toISOString();
    mistake.reviewTimes += 1;
    mistake.lastReviewTime = now;
    
    // 添加复习记录
    mistake.reviewHistory.push({
      date: now,
      result: isCorrect ? 'correct' : 'wrong'
    });

    // 更新掌握程度
    if (isCorrect) {
      mistake.masteryLevel = Math.min(5, mistake.masteryLevel + 1);
    } else {
      mistake.masteryLevel = Math.max(1, mistake.masteryLevel - 1);
    }

    // 计算下次复习时间
    mistake.nextReviewTime = this.calculateNextReviewTime(mistake.reviewTimes, isCorrect);

    return this.updateMistake(mistakeId, mistake);
  }

  // 计算下次复习时间（基于艾宾浩斯遗忘曲线）
  calculateNextReviewTime(reviewTimes, wasCorrect = true) {
    const now = new Date();
    let daysToAdd = 1;

    if (wasCorrect) {
      // 答对了，延长复习间隔
      const intervals = [1, 3, 7, 15, 30, 60]; // 天数
      daysToAdd = intervals[Math.min(reviewTimes, intervals.length - 1)];
    } else {
      // 答错了，缩短复习间隔
      daysToAdd = 1;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  // 生成唯一ID
  generateId() {
    return 'mistake_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 获取科目列表
  getSubjects() {
    try {
      const defaultSubjects = [
        { id: 'math', name: '数学', color: '#ff6b6b', chapters: ['高等数学', '线性代数', '概率论'] },
        { id: 'english', name: '英语', color: '#4ecdc4', chapters: ['阅读理解', '完形填空', '翻译', '作文'] },
        { id: 'politics', name: '政治', color: '#45b7d1', chapters: ['马原', '毛概', '史纲', '思修'] },
        { id: 'professional', name: '专业课', color: '#96ceb4', chapters: ['专业基础', '专业综合'] }
      ];

      return wx.getStorageSync(this.subjectsKey) || defaultSubjects;
    } catch (e) {
      console.error('Failed to load subjects:', e);
      return [];
    }
  }

  // 初始化错题本数据（仅在需要时调用）
  initializeIfNeeded() {
    try {
      // 检查是否已经初始化
      if (wx.getStorageSync('mistakes_initialized')) {
        return;
      }

      // 初始化默认科目（如果不存在）
      const subjects = this.getSubjects();
      if (!wx.getStorageSync(this.subjectsKey)) {
        this.saveSubjects(subjects);
      }

      // 初始化示例错题数据
      const existingMistakes = this.getAllMistakes();
      if (existingMistakes.length === 0) {
        this.initSampleMistakes();
      }

      // 标记为已初始化
      wx.setStorageSync('mistakes_initialized', true);

      // 初始化完成后更新统计数据
      this.updateStats();
    } catch (e) {
      console.error('Failed to initialize mistake data:', e);
    }
  }

  // 初始化示例错题数据
  initSampleMistakes() {
    const sampleMistakes = [
      {
        id: 'sample_001',
        subject: '数学',
        chapter: '高等数学',
        knowledgePoint: '导数',
        question: '求函数 f(x) = x³ - 3x² + 2x 的导数',
        myAnswer: 'f\'(x) = 3x² - 6x + 2x',
        correctAnswer: 'f\'(x) = 3x² - 6x + 2',
        explanation: '对多项式求导，每一项分别求导：x³的导数是3x²，-3x²的导数是-6x，2x的导数是2',
        difficulty: 2,
        tags: ['导数', '多项式'],
        masteryLevel: 1,
        reviewTimes: 0,
        createTime: new Date().toISOString(),
        lastReviewTime: null,
        nextReviewTime: new Date().toISOString(),
        reviewHistory: [],
        isStarred: false,
        questionImage: '',
        answerImage: ''
      },
      {
        id: 'sample_002',
        subject: '英语',
        chapter: '阅读理解',
        knowledgePoint: '词汇理解',
        question: 'The word "elaborate" in the passage most likely means:',
        myAnswer: 'simple',
        correctAnswer: 'detailed',
        explanation: 'elaborate作为形容词时意为"详细的，复杂的"，与detailed意思相近',
        difficulty: 3,
        tags: ['词汇', '阅读理解'],
        masteryLevel: 2,
        reviewTimes: 1,
        createTime: new Date(Date.now() - 86400000).toISOString(),
        lastReviewTime: new Date().toISOString(),
        nextReviewTime: new Date(Date.now() - 3600000).toISOString(), // 1小时前，需要复习
        reviewHistory: [
          { date: new Date().toISOString(), result: 'wrong' }
        ],
        isStarred: true,
        questionImage: '',
        answerImage: ''
      },
      {
        id: 'sample_003',
        subject: '政治',
        chapter: '马原',
        knowledgePoint: '唯物辩证法',
        question: '矛盾的同一性和斗争性的关系是什么？',
        myAnswer: '矛盾的同一性是绝对的',
        correctAnswer: '矛盾的同一性是相对的，斗争性是绝对的',
        explanation: '矛盾的同一性是有条件的、相对的，矛盾的斗争性是无条件的、绝对的。同一性和斗争性相互联结、相互制约。',
        difficulty: 4,
        tags: ['马原', '唯物辩证法', '矛盾'],
        masteryLevel: 1,
        reviewTimes: 0,
        createTime: new Date(Date.now() - 172800000).toISOString(), // 2天前
        lastReviewTime: null,
        nextReviewTime: new Date().toISOString(), // 现在需要复习
        reviewHistory: [],
        isStarred: false,
        questionImage: '',
        answerImage: ''
      }
    ];

    // 直接保存示例数据，避免触发统计更新
    try {
      const mistakes = this.getAllMistakes();
      sampleMistakes.forEach(mistake => {
        mistakes.push(mistake);
      });
      wx.setStorageSync(this.storageKey, mistakes);
    } catch (e) {
      console.error('Failed to save sample mistakes:', e);
    }
  }

  // 保存科目配置
  saveSubjects(subjects) {
    try {
      wx.setStorageSync(this.subjectsKey, subjects);
      return true;
    } catch (e) {
      console.error('Failed to save subjects:', e);
      return false;
    }
  }

  // 更新统计数据
  updateStats() {
    const mistakes = this.getAllMistakes();
    const subjects = this.getSubjects();
    
    const stats = {
      totalMistakes: mistakes.length,
      subjectStats: {},
      masteryStats: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      reviewStats: {
        needReview: this.getMistakesForReview().length,
        totalReviews: mistakes.reduce((sum, m) => sum + m.reviewTimes, 0)
      },
      lastUpdate: new Date().toISOString()
    };

    // 按科目统计
    subjects.forEach(subject => {
      const subjectMistakes = mistakes.filter(m => m.subject === subject.name);
      stats.subjectStats[subject.name] = {
        total: subjectMistakes.length,
        mastered: subjectMistakes.filter(m => m.masteryLevel >= 4).length,
        needReview: subjectMistakes.filter(m => m.nextReviewTime <= new Date().toISOString()).length
      };
    });

    // 按掌握程度统计
    mistakes.forEach(mistake => {
      stats.masteryStats[mistake.masteryLevel]++;
    });

    try {
      wx.setStorageSync(this.statsKey, stats);
    } catch (e) {
      console.error('Failed to save stats:', e);
    }

    return stats;
  }

  // 获取统计数据
  getStats() {
    try {
      return wx.getStorageSync(this.statsKey) || this.updateStats();
    } catch (e) {
      console.error('Failed to load stats:', e);
      return this.updateStats();
    }
  }

  // 搜索错题
  searchMistakes(keyword) {
    const mistakes = this.getAllMistakes();
    const lowerKeyword = keyword.toLowerCase();
    
    return mistakes.filter(mistake => 
      mistake.question.toLowerCase().includes(lowerKeyword) ||
      mistake.knowledgePoint.toLowerCase().includes(lowerKeyword) ||
      mistake.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      mistake.explanation.toLowerCase().includes(lowerKeyword)
    );
  }

  // 导出数据
  exportData() {
    return {
      mistakes: this.getAllMistakes(),
      subjects: this.getSubjects(),
      stats: this.getStats(),
      exportTime: new Date().toISOString()
    };
  }

  // 导入数据
  importData(data) {
    try {
      if (data.mistakes) {
        wx.setStorageSync(this.storageKey, data.mistakes);
      }
      if (data.subjects) {
        wx.setStorageSync(this.subjectsKey, data.subjects);
      }
      this.updateStats();
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
}

module.exports = MistakeManager;
