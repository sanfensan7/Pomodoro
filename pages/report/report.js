const weeklyReportGenerator = require('../../utils/weekly-report-generator');
const logger = require('../../utils/logger');
const vibrate = require('../../utils/vibrate');

Page({
  data: {
    themeColor: '#ff6b6b',
    
    // 当前报告
    currentReport: null,
    loading: true,
    
    // 历史报告列表
    historyReports: [],
    showHistory: false,
    
    // 分享相关
    shareCanvas: null
  },

  onLoad: function(options) {
    // 如果有指定报告ID，加载指定报告
    if (options.reportId) {
      this.loadReport(options.reportId);
    } else {
      // 否则生成本周报告
      this.generateCurrentWeekReport();
    }
    
    this.loadHistoryReports();
  },

  onShow: function() {
    const app = getApp();
    if (app.globalData.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
  },

  /**
   * 生成本周报告
   */
  generateCurrentWeekReport: function() {
    this.setData({ loading: true });
    
    try {
      const report = weeklyReportGenerator.generateWeeklyReport();
      this.setData({
        currentReport: report,
        loading: false
      });
      
      logger.log('本周报告已生成');
    } catch (error) {
      logger.error('生成报告失败', error);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '生成报告失败',
        icon: 'error'
      });
    }
  },

  /**
   * 加载指定报告
   */
  loadReport: function(reportId) {
    this.setData({ loading: true });
    
    const report = weeklyReportGenerator.getReport(reportId);
    if (report) {
      this.setData({
        currentReport: report,
        loading: false
      });
    } else {
      this.setData({ loading: false });
      wx.showToast({
        title: '报告不存在',
        icon: 'error'
      });
    }
  },

  /**
   * 加载历史报告
   */
  loadHistoryReports: function() {
    const reports = weeklyReportGenerator.getHistoryReports();
    this.setData({
      historyReports: reports
    });
  },

  /**
   * 切换历史报告显示
   */
  toggleHistory: function() {
    vibrate.buttonTap();
    this.setData({
      showHistory: !this.data.showHistory
    });
  },

  /**
   * 选择历史报告
   */
  selectHistoryReport: function(e) {
    const reportId = e.currentTarget.dataset.reportId;
    vibrate.buttonTap();
    
    this.loadReport(reportId);
    this.setData({
      showHistory: false
    });
  },

  /**
   * 重新生成报告
   */
  regenerateReport: function() {
    vibrate.buttonTap();
    
    wx.showModal({
      title: '重新生成报告',
      content: '确定要重新生成本周的学习报告吗？',
      success: (res) => {
        if (res.confirm) {
          this.generateCurrentWeekReport();
        }
      }
    });
  },

  /**
   * 分享报告
   */
  shareReport: function() {
    vibrate.buttonTap();
    
    if (!this.data.currentReport) {
      wx.showToast({
        title: '没有可分享的报告',
        icon: 'none'
      });
      return;
    }

    // 生成分享海报
    this.generateSharePoster();
  },

  /**
   * 生成分享海报
   */
  generateSharePoster: function() {
    wx.showLoading({
      title: '生成海报中...'
    });

    // 创建画布
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = 750 * dpr;
          canvas.height = 1334 * dpr;
          ctx.scale(dpr, dpr);
          
          this.drawReportPoster(ctx, canvas);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '生成海报失败',
            icon: 'error'
          });
        }
      });
  },

  /**
   * 绘制报告海报
   */
  drawReportPoster: function(ctx, canvas) {
    const report = this.data.currentReport;
    const { themeColor } = this.data;
    
    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 1334);
    gradient.addColorStop(0, '#f5f7fa');
    gradient.addColorStop(1, '#c3cfe2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 750, 1334);
    
    // 标题区域
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, 750, 200);
    
    // 标题文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📊 学习周报', 375, 80);
    
    ctx.font = '32px sans-serif';
    ctx.fillText(`${report.weekRange.start} ~ ${report.weekRange.end}`, 375, 130);
    
    // 统计数据区域
    const stats = [
      { label: '专注时长', value: `${report.stats.totalMinutes}分钟`, icon: '⏱️' },
      { label: '完成任务', value: `${report.stats.completedTasks}个`, icon: '✅' },
      { label: '活跃天数', value: `${report.stats.activeDays}天`, icon: '📅' },
      { label: '一致性', value: `${report.stats.consistency}%`, icon: '🎯' }
    ];
    
    let yPos = 280;
    stats.forEach((stat, index) => {
      const xPos = (index % 2) * 375 + 187.5;
      if (index % 2 === 0 && index > 0) yPos += 120;
      
      // 统计卡片背景
      ctx.fillStyle = 'white';
      ctx.fillRect(xPos - 150, yPos - 40, 300, 80);
      
      // 图标
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat.icon, xPos - 80, yPos);
      
      // 数值
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(stat.value, xPos + 20, yPos - 10);
      
      // 标签
      ctx.fillStyle = '#666';
      ctx.font = '24px sans-serif';
      ctx.fillText(stat.label, xPos + 20, yPos + 20);
    });
    
    // 成就区域
    yPos += 150;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 本周成就', 375, yPos);
    
    yPos += 60;
    report.achievements.slice(0, 3).forEach((achievement, index) => {
      ctx.fillStyle = 'white';
      ctx.fillRect(50, yPos, 650, 80);
      
      // 成就图标
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.icon, 80, yPos + 50);
      
      // 成就标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(achievement.title, 140, yPos + 35);
      
      // 成就描述
      ctx.fillStyle = '#666';
      ctx.font = '24px sans-serif';
      ctx.fillText(achievement.description, 140, yPos + 65);
      
      yPos += 100;
    });
    
    // 底部信息
    yPos = 1250;
    ctx.fillStyle = '#999';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('番茄时钟 - 专注学习，高效管理', 375, yPos);
    
    // 保存图片
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          wx.hideLoading();
          this.previewShareImage(res.tempFilePath);
        },
        fail: (error) => {
          wx.hideLoading();
          logger.error('生成海报失败', error);
          wx.showToast({
            title: '生成海报失败',
            icon: 'error'
          });
        }
      });
    }, 500);
  },

  /**
   * 预览分享图片
   */
  previewShareImage: function(imagePath) {
    wx.previewImage({
      urls: [imagePath],
      success: () => {
        // 提供保存选项
        wx.showActionSheet({
          itemList: ['保存到相册', '分享给朋友'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.saveImageToAlbum(imagePath);
            } else if (res.tapIndex === 1) {
              this.shareImageToFriend(imagePath);
            }
          }
        });
      }
    });
  },

  /**
   * 保存图片到相册
   */
  saveImageToAlbum: function(imagePath) {
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
      },
      fail: (error) => {
        if (error.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限',
            showCancel: false
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      }
    });
  },

  /**
   * 分享图片给朋友
   */
  shareImageToFriend: function(imagePath) {
    // 这里可以实现分享逻辑
    wx.showToast({
      title: '请长按图片分享',
      icon: 'none'
    });
  },

  /**
   * 格式化日期
   */
  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
});
