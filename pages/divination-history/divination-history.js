var app = getApp();
var shareHelper = require('../../utils/share-helper');

Page({
  data: {
    themeColor: '#ff6b6b',
    records: [],
    selectedRecord: null,
    showDetail: false
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

    this.loadRecords();
  },

  onShow: function() {
    // 更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }

    // 重新加载记录
    this.loadRecords();
  },

  loadRecords: function() {
    var records = wx.getStorageSync('divinationRecords') || [];
    this.setData({
      records: records
    });
  },

  viewDetail: function(e) {
    var index = e.currentTarget.dataset.index;
    var record = this.data.records[index];
    
    this.setData({
      selectedRecord: record,
      showDetail: true
    });
  },

  closeDetail: function() {
    this.setData({
      showDetail: false,
      selectedRecord: null
    });
  },

  deleteRecord: function(e) {
    var index = e.currentTarget.dataset.index;
    var self = this;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条算命记录吗？',
      success: function(res) {
        if (res.confirm) {
          var records = self.data.records;
          records.splice(index, 1);
          
          self.setData({
            records: records
          });

          wx.setStorageSync('divinationRecords', records);

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  clearAllRecords: function() {
    var self = this;

    if (this.data.records.length === 0) {
      wx.showToast({
        title: '暂无记录',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有算命记录吗？此操作不可恢复。',
      success: function(res) {
        if (res.confirm) {
          self.setData({
            records: []
          });

          wx.setStorageSync('divinationRecords', []);

          wx.showToast({
            title: '清空成功',
            icon: 'success'
          });
        }
      }
    });
  },

  shareRecord: function(e) {
    var index = e.currentTarget.dataset.index;
    var record = this.data.records[index];

    var shareContent = '我在番茄专注钟算了一卦：\n\n';
    shareContent += '问题：' + record.userInfo.question + '\n';
    shareContent += '结果：' + record.summary + '\n\n';
    shareContent += '你也来试试吧！';

    wx.setClipboardData({
      data: shareContent,
      success: function() {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  goToDivination: function() {
    wx.navigateTo({
      url: '/pages/divination/divination'
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '我的算命记录，准得不得了！',
      path: '/pages/divination/divination',
      imageUrl: ''
    };
  },

  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  }
});
