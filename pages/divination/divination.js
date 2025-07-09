var app = getApp();
var shareHelper = require('../../utils/share-helper');

Page({
  data: {
    themeColor: '#ff6b6b',
    currentStep: 'input', // input, loading, result
    userInfo: {
      name: '',
      birthDate: '',
      birthTime: '',
      gender: 'male',
      question: ''
    },
    divinationResult: null,
    isLoading: false,
    timeOptions: [
      '子时 (23:00-01:00)', '丑时 (01:00-03:00)', '寅时 (03:00-05:00)',
      '卯时 (05:00-07:00)', '辰时 (07:00-09:00)', '巳时 (09:00-11:00)',
      '午时 (11:00-13:00)', '未时 (13:00-15:00)', '申时 (15:00-17:00)',
      '酉时 (17:00-19:00)', '戌时 (19:00-21:00)', '亥时 (21:00-23:00)'
    ],
    selectedTimeIndex: 0
  },

  onLoad: function() {
    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 获取主题色
    var themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    this.setData({
      themeColor: themeColor
    });
  },

  onShow: function() {
    // 更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
  },

  // 输入处理
  inputName: function(e) {
    this.setData({
      'userInfo.name': e.detail.value
    });
  },

  inputBirthDate: function(e) {
    this.setData({
      'userInfo.birthDate': e.detail.value
    });
  },

  selectGender: function(e) {
    var gender = e.currentTarget.dataset.gender;
    this.setData({
      'userInfo.gender': gender
    });
  },

  selectBirthTime: function(e) {
    this.setData({
      selectedTimeIndex: e.detail.value,
      'userInfo.birthTime': this.data.timeOptions[e.detail.value]
    });
  },

  inputQuestion: function(e) {
    this.setData({
      'userInfo.question': e.detail.value
    });
  },

  // 开始算命
  startDivination: function() {
    var userInfo = this.data.userInfo;
    
    // 验证输入
    if (!userInfo.name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!userInfo.birthDate) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      });
      return;
    }

    if (!userInfo.question.trim()) {
      wx.showToast({
        title: '请输入要占卜的问题',
        icon: 'none'
      });
      return;
    }

    this.setData({
      currentStep: 'loading',
      isLoading: true
    });

    this.callDivinationAPI();
  },

  // 调用算命API
  callDivinationAPI: function() {
    var self = this;
    var userInfo = this.data.userInfo;
    
    // 构建提示词
    var prompt = this.buildPrompt(userInfo);

    wx.request({
      url: 'https://api.deepseek.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-856ceedb130b4fb6a51b47d843c470e9'
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位资深的周易算命大师，精通八字、五行、易经卦象。你的回答要客观均衡，既要指出有利的方面，也要提醒可能的挑战和注意事项。不要只说好话，要给出实用的建议。回答要通俗易懂，避免过于深奥的术语。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          var aiResponse = res.data.choices[0].message.content;
          var formattedResult = self.formatDivinationResult(aiResponse, userInfo);
          
          self.setData({
            currentStep: 'result',
            isLoading: false,
            divinationResult: formattedResult
          });

          // 保存算命记录
          self.saveDivinationRecord(formattedResult);
        } else {
          self.handleAPIError('API响应格式错误');
        }
      },
      fail: function(error) {
        console.error('算命API调用失败:', error);
        self.handleAPIError('网络请求失败，请检查网络连接');
      }
    });
  },

  // 构建提示词
  buildPrompt: function(userInfo) {
    var prompt = '请为以下信息进行周易算命分析：\n\n';
    prompt += '姓名：' + userInfo.name + '\n';
    prompt += '性别：' + (userInfo.gender === 'male' ? '男' : '女') + '\n';
    prompt += '出生日期：' + userInfo.birthDate + '\n';
    prompt += '出生时辰：' + userInfo.birthTime + '\n';
    prompt += '占卜问题：' + userInfo.question + '\n\n';
    
    prompt += '请从以下几个方面进行分析：\n';
    prompt += '1. 八字命理分析（五行属性、命格特点）\n';
    prompt += '2. 针对所问问题的具体分析\n';
    prompt += '3. 有利因素和机遇\n';
    prompt += '4. 需要注意的挑战和风险\n';
    prompt += '5. 实用建议和改善方法\n';
    prompt += '6. 总体运势评价\n\n';
    
    prompt += '要求：\n';
    prompt += '- 客观均衡，不要只说好话\n';
    prompt += '- 语言通俗易懂，避免过于专业的术语\n';
    prompt += '- 给出具体可行的建议\n';
    prompt += '- 每个方面都要有具体内容，不要泛泛而谈';

    return prompt;
  },

  // 格式化算命结果
  formatDivinationResult: function(aiResponse, userInfo) {
    var result = {
      timestamp: new Date().toLocaleString(),
      userInfo: userInfo,
      content: this.parseAIResponse(aiResponse),
      summary: this.extractSummary(aiResponse)
    };

    return result;
  },

  // 解析AI响应
  parseAIResponse: function(response) {
    var sections = {
      bazi: '',
      analysis: '',
      advantages: '',
      challenges: '',
      suggestions: '',
      overall: ''
    };

    // 简单的文本解析，提取各个部分
    var lines = response.split('\n');
    var currentSection = '';
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      if (line.includes('八字') || line.includes('命理')) {
        currentSection = 'bazi';
      } else if (line.includes('问题') || line.includes('分析')) {
        currentSection = 'analysis';
      } else if (line.includes('有利') || line.includes('机遇') || line.includes('优势')) {
        currentSection = 'advantages';
      } else if (line.includes('挑战') || line.includes('风险') || line.includes('注意')) {
        currentSection = 'challenges';
      } else if (line.includes('建议') || line.includes('改善')) {
        currentSection = 'suggestions';
      } else if (line.includes('总体') || line.includes('运势')) {
        currentSection = 'overall';
      } else if (currentSection && !line.match(/^\d+\./)) {
        sections[currentSection] += line + '\n';
      }
    }

    // 如果解析失败，使用原始响应
    if (!sections.bazi && !sections.analysis) {
      sections.analysis = response;
    }

    return sections;
  },

  // 提取总结
  extractSummary: function(response) {
    var lines = response.split('\n');
    var summary = '';
    
    // 查找包含总结性词汇的句子
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.includes('总体') || line.includes('综合') || line.includes('整体')) {
        summary = line;
        break;
      }
    }

    if (!summary && lines.length > 0) {
      summary = lines[lines.length - 1].trim();
    }

    return summary || '运势变化无常，关键在于把握机遇，化解挑战。';
  },

  // 保存算命记录
  saveDivinationRecord: function(result) {
    var records = wx.getStorageSync('divinationRecords') || [];
    records.unshift(result);
    
    // 最多保存20条记录
    if (records.length > 20) {
      records = records.slice(0, 20);
    }
    
    wx.setStorageSync('divinationRecords', records);
  },

  // 处理API错误
  handleAPIError: function(message) {
    this.setData({
      currentStep: 'input',
      isLoading: false
    });

    wx.showModal({
      title: '算命失败',
      content: message || '算命服务暂时不可用，请稍后再试',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 重新算命
  resetDivination: function() {
    this.setData({
      currentStep: 'input',
      divinationResult: null,
      'userInfo.question': ''
    });
  },

  // 查看历史记录
  viewHistory: function() {
    wx.navigateTo({
      url: '/pages/divination-history/divination-history'
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    if (this.data.divinationResult) {
      return {
        title: '我刚算了一卦，结果很准！你也来试试',
        path: '/pages/divination/divination',
        imageUrl: ''
      };
    }
    return shareHelper.getShareAppMessageConfig('total', '/pages/divination/divination');
  },

  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  }
});
