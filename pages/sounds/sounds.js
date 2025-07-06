Page({
  data: {
    themeColor: '#ff6b6b',
    currentSound: 'none',
    isPlaying: false,
    volume: 50,
    sounds: [
      {
        id: 'none',
        name: '无音效',
        icon: '🔇',
        description: '专注时保持安静'
      },
      {
        id: 'rain',
        name: '雨声',
        icon: '🌧️',
        description: '轻柔的雨滴声'
      },
      {
        id: 'ocean',
        name: '海浪',
        icon: '🌊',
        description: '舒缓的海浪声'
      },
      {
        id: 'forest',
        name: '森林',
        icon: '🌲',
        description: '鸟鸣和风声'
      },
      {
        id: 'cafe',
        name: '咖啡厅',
        icon: '☕',
        description: '温馨的咖啡厅氛围'
      },
      {
        id: 'fireplace',
        name: '壁炉',
        icon: '🔥',
        description: '温暖的壁炉声'
      },
      {
        id: 'whitenoise',
        name: '白噪音',
        icon: '📻',
        description: '纯净的白噪音'
      },
      {
        id: 'pinknoise',
        name: '粉噪音',
        icon: '🎵',
        description: '柔和的粉噪音'
      }
    ]
  },

  onLoad: function() {
    // 获取主题色
    const themeColor = wx.getStorageSync('themeColor') || '#ff6b6b';
    
    // 获取当前音效设置
    const currentSound = wx.getStorageSync('backgroundSound') || 'none';
    const volume = wx.getStorageSync('soundVolume') || 50;
    
    this.setData({
      themeColor: themeColor,
      currentSound: currentSound,
      volume: volume
    });
  },

  selectSound: function(e) {
    const soundId = e.currentTarget.dataset.id;
    
    // 停止当前播放的音效
    this.stopCurrentSound();
    
    this.setData({
      currentSound: soundId,
      isPlaying: false
    });
    
    // 保存设置
    wx.setStorageSync('backgroundSound', soundId);
    
    // 如果不是无音效，则播放预览
    if (soundId !== 'none') {
      this.playPreview(soundId);
    }
  },

  playPreview: function(soundId) {
    // 这里可以播放音效预览
    // 由于小程序限制，我们使用模拟的方式
    this.setData({
      isPlaying: true
    });
    
    wx.showToast({
      title: '正在播放预览',
      icon: 'none',
      duration: 1000
    });
    
    // 3秒后停止预览
    var self = this;
    setTimeout(function() {
      self.setData({
        isPlaying: false
      });
    }, 3000);
  },

  stopCurrentSound: function() {
    // 停止当前音效播放
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
    
    this.setData({
      isPlaying: false
    });
  },

  togglePlay: function() {
    if (this.data.currentSound === 'none') {
      wx.showToast({
        title: '请先选择音效',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.isPlaying) {
      this.stopCurrentSound();
    } else {
      this.playPreview(this.data.currentSound);
    }
  },

  changeVolume: function(e) {
    const volume = e.detail.value;
    this.setData({
      volume: volume
    });
    
    // 保存音量设置
    wx.setStorageSync('soundVolume', volume);
    
    // 调整当前播放音效的音量
    if (this.audioContext) {
      this.audioContext.volume = volume / 100;
    }
  },

  onUnload: function() {
    // 页面卸载时停止音效
    this.stopCurrentSound();
  }
});
