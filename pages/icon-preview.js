const svgToPng = require('../utils/svgToPng');

Page({
  data: {
    iconsGenerated: false,
    successCount: 0,
    icons: [
      'clock',
      'clock-active',
      'task',
      'task-active',
      'stats',
      'stats-active',
      'settings',
      'settings-active'
    ]
  },
  
  onLoad: function() {
    this.regenerateIcons();
  },
  
  regenerateIcons: function() {
    let successCount = 0;
    const icons = this.data.icons;
    
    try {
      // 尝试使用异步方法生成
      svgToPng.convertSvgToPng();
      
      // 再尝试使用更可靠的同步方法逐个生成
      icons.forEach(icon => {
        try {
          if (svgToPng.convertOneIcon(icon)) {
            successCount++;
          }
        } catch (e) {
          console.error(`生成 ${icon}.png 失败:`, e);
        }
      });
      
      this.setData({
        iconsGenerated: true,
        successCount: successCount
      });
      
      wx.showToast({
        title: `成功生成${successCount}个图标`,
        icon: 'success'
      });
      
      // 重启小程序以应用图标
      setTimeout(() => {
        wx.showModal({
          title: '提示',
          content: '图标已生成，建议重启小程序以加载新图标',
          showCancel: false
        });
      }, 1500);
      
    } catch (e) {
      console.error('生成图标失败:', e);
      wx.showToast({
        title: '生成图标失败',
        icon: 'none'
      });
    }
  }
}); 