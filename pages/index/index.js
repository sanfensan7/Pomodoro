// index.js
var shareHelper = require('../../utils/share-helper');

Page({
  data: {},

  onLoad: function() {
    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 分享给微信好友
  onShareAppMessage: function() {
    return shareHelper.getShareAppMessageConfig('total', '/pages/index/index');
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  }
})
