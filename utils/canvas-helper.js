/**
 * Canvas 2D API 辅助工具
 * 使用新版 Canvas 2D API 替代旧版 createCanvasContext
 */

const logger = require('./logger');

class CanvasHelper {
  constructor() {
    this.canvasCache = {};
    this.animationFrameId = null;
  }
  
  /**
   * 获取Canvas实例
   * @param {Object} component - 页面或组件实例
   * @param {string} selector - Canvas选择器
   * @returns {Promise<Object>} Canvas节点和上下文
   */
  getCanvas(component, selector) {
    return new Promise((resolve, reject) => {
      // 检查缓存
      if (this.canvasCache[selector]) {
        resolve(this.canvasCache[selector]);
        return;
      }
      
      const query = wx.createSelectorQuery().in(component);
      query.select(selector)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            logger.warn('Canvas节点不存在，回退到旧版API', { selector });
            // 回退到旧版API
            resolve({
              isLegacy: true,
              ctx: wx.createCanvasContext(selector.replace('#', ''), component),
              width: 300,
              height: 300
            });
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          // 设置Canvas实际大小
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          
          // 缩放上下文以匹配设备像素比
          ctx.scale(dpr, dpr);
          
          const canvasInfo = {
            canvas,
            ctx,
            width: res[0].width,
            height: res[0].height,
            dpr,
            isLegacy: false
          };
          
          // 缓存Canvas实例
          this.canvasCache[selector] = canvasInfo;
          
          logger.log('Canvas 2D初始化成功', { selector, width: res[0].width, height: res[0].height });
          resolve(canvasInfo);
        });
    });
  }
  
  /**
   * 绘制圆形进度条
   * @param {Object} canvasInfo - Canvas信息
   * @param {Object} options - 绘制选项
   */
  drawCircularProgress(canvasInfo, options = {}) {
    const {
      progress = 0,
      color = '#ff6b6b',
      backgroundColor = '#f0f0f0',
      lineWidth = 15,
      showShadow = false
    } = options;
    
    const { ctx, width, height, isLegacy } = canvasInfo;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - lineWidth;
    
    // 清除画布
    if (isLegacy) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
    
    // 绘制背景圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = backgroundColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // 绘制进度圆环
    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(
        centerX, 
        centerY, 
        radius, 
        -Math.PI / 2, 
        -Math.PI / 2 + progress * 2 * Math.PI
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      
      // 添加阴影效果
      if (showShadow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.stroke();
      
      // 重置阴影
      if (showShadow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    }
    
    // 旧版API需要调用draw
    if (isLegacy) {
      ctx.draw();
    }
  }
  
  /**
   * 绘制线性进度条
   * @param {Object} canvasInfo - Canvas信息
   * @param {Object} options - 绘制选项
   */
  drawLinearProgress(canvasInfo, options = {}) {
    const {
      progress = 0,
      color = '#ff6b6b',
      backgroundColor = '#f0f0f0',
      borderRadius = 5
    } = options;
    
    const { ctx, width, height, isLegacy } = canvasInfo;
    const progressWidth = progress * width;
    
    // 清除画布
    if (isLegacy) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
    
    // 绘制背景
    ctx.beginPath();
    this.roundRect(ctx, 0, 0, width, height, borderRadius);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    
    // 绘制进度
    if (progress > 0) {
      ctx.beginPath();
      this.roundRect(ctx, 0, 0, progressWidth, height, borderRadius);
      ctx.fillStyle = color;
      ctx.fill();
    }
    
    // 旧版API需要调用draw
    if (isLegacy) {
      ctx.draw();
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
  
  /**
   * 使用requestAnimationFrame优化绘制
   * @param {Function} drawFunc - 绘制函数
   * @param {number} fps - 帧率限制（默认30fps）
   */
  animateDraw(drawFunc, fps = 30) {
    // 取消之前的动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const interval = 1000 / fps;
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      
      if (delta >= interval) {
        drawFunc();
        lastTime = now - (delta % interval);
      }
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * 停止动画
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * 清除Canvas缓存
   * @param {string} selector - Canvas选择器，不传则清除所有
   */
  clearCache(selector = null) {
    if (selector) {
      delete this.canvasCache[selector];
    } else {
      this.canvasCache = {};
    }
  }
  
  /**
   * 创建渐变色
   * @param {Object} ctx - Canvas上下文
   * @param {Object} options - 渐变选项
   * @returns {CanvasGradient} 渐变对象
   */
  createGradient(ctx, options = {}) {
    const {
      type = 'linear', // 'linear' or 'radial'
      x0 = 0,
      y0 = 0,
      x1 = 100,
      y1 = 100,
      r0 = 0,
      r1 = 100,
      colorStops = [
        { position: 0, color: '#ff6b6b' },
        { position: 1, color: '#feca57' }
      ]
    } = options;
    
    let gradient;
    
    if (type === 'linear') {
      gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    } else {
      gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    }
    
    colorStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });
    
    return gradient;
  }
}

// 创建单例
const canvasHelper = new CanvasHelper();

module.exports = canvasHelper;

