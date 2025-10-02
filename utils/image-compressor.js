/**
 * 图片压缩工具
 * 用于压缩用户上传的图片，避免内存溢出
 */

const logger = require('./logger');
const perfMonitor = require('./performance-monitor');

class ImageCompressor {
  constructor() {
    // 默认配置
    this.defaultConfig = {
      quality: 80,          // 压缩质量 0-100
      maxWidth: 1200,       // 最大宽度
      maxHeight: 1200,      // 最大高度
      maxSize: 500 * 1024   // 最大文件大小 500KB
    };
  }
  
  /**
   * 压缩图片
   * @param {string} imagePath - 图片路径
   * @param {object} options - 压缩配置
   * @returns {Promise<string>} 压缩后的图片路径
   */
  async compress(imagePath, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    const tracker = perfMonitor.trackImageLoad('compress', 0);
    
    try {
      logger.log('开始压缩图片', { path: imagePath, config });
      
      // 1. 获取图片信息
      const imageInfo = await this.getImageInfo(imagePath);
      logger.log('图片信息', imageInfo);
      
      // 2. 判断是否需要压缩
      if (!this.needCompress(imageInfo, config)) {
        logger.log('图片无需压缩');
        tracker.end({ skipped: true });
        return imagePath;
      }
      
      // 3. 压缩图片
      const compressedPath = await this.compressImage(imagePath, imageInfo, config);
      
      // 4. 获取压缩后的图片信息
      const compressedInfo = await this.getImageInfo(compressedPath);
      
      const compressionRate = ((1 - compressedInfo.size / imageInfo.size) * 100).toFixed(2);
      logger.log('图片压缩完成', {
        原始大小: this.formatSize(imageInfo.size),
        压缩后大小: this.formatSize(compressedInfo.size),
        压缩率: `${compressionRate}%`
      });
      
      tracker.end({
        originalSize: imageInfo.size,
        compressedSize: compressedInfo.size,
        compressionRate: compressionRate
      });
      
      return compressedPath;
      
    } catch (error) {
      logger.error('图片压缩失败', error, { imagePath });
      tracker.end({ error: true });
      // 压缩失败，返回原图
      return imagePath;
    }
  }
  
  /**
   * 获取图片信息
   */
  getImageInfo(imagePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imagePath,
        success: (res) => {
          // 尝试获取文件大小
          wx.getFileInfo({
            filePath: imagePath,
            success: (fileInfo) => {
              resolve({
                width: res.width,
                height: res.height,
                path: res.path,
                size: fileInfo.size,
                type: res.type
              });
            },
            fail: () => {
              // 如果获取文件信息失败，至少返回图片尺寸
              resolve({
                width: res.width,
                height: res.height,
                path: res.path,
                size: 0,
                type: res.type
              });
            }
          });
        },
        fail: reject
      });
    });
  }
  
  /**
   * 判断是否需要压缩
   */
  needCompress(imageInfo, config) {
    // 图片尺寸超过限制
    const sizeExceeded = imageInfo.width > config.maxWidth || 
                        imageInfo.height > config.maxHeight;
    
    // 文件大小超过限制
    const fileSizeExceeded = imageInfo.size > config.maxSize;
    
    return sizeExceeded || fileSizeExceeded;
  }
  
  /**
   * 压缩图片
   */
  async compressImage(imagePath, imageInfo, config) {
    // 计算目标尺寸
    const targetSize = this.calculateTargetSize(imageInfo, config);
    
    // 先尝试使用 wx.compressImage（如果可用）
    try {
      const result = await this.wxCompressImage(imagePath, config.quality);
      return result;
    } catch (error) {
      logger.warn('wx.compressImage 不可用，使用 canvas 压缩');
      // 降级使用 canvas 压缩
      return await this.canvasCompress(imagePath, targetSize, config.quality);
    }
  }
  
  /**
   * 使用微信API压缩图片
   */
  wxCompressImage(imagePath, quality) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: imagePath,
        quality: quality,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: reject
      });
    });
  }
  
  /**
   * 使用Canvas压缩图片
   */
  canvasCompress(imagePath, targetSize, quality) {
    return new Promise((resolve, reject) => {
      // 创建离屏canvas
      const canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: targetSize.width,
        height: targetSize.height
      });
      
      const ctx = canvas.getContext('2d');
      
      // 加载图片
      const image = canvas.createImage();
      
      image.onload = () => {
        // 绘制图片
        ctx.drawImage(image, 0, 0, targetSize.width, targetSize.height);
        
        // 导出图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          quality: quality / 100,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: reject
        });
      };
      
      image.onerror = reject;
      image.src = imagePath;
    });
  }
  
  /**
   * 计算目标尺寸
   */
  calculateTargetSize(imageInfo, config) {
    let { width, height } = imageInfo;
    const { maxWidth, maxHeight } = config;
    
    // 计算缩放比例
    let scale = 1;
    
    if (width > maxWidth) {
      scale = maxWidth / width;
    }
    
    if (height * scale > maxHeight) {
      scale = maxHeight / height;
    }
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale)
    };
  }
  
  /**
   * 批量压缩图片
   */
  async compressBatch(imagePaths, options = {}) {
    logger.log('批量压缩图片', { count: imagePaths.length });
    
    const results = [];
    for (const imagePath of imagePaths) {
      try {
        const compressed = await this.compress(imagePath, options);
        results.push({
          original: imagePath,
          compressed: compressed,
          success: true
        });
      } catch (error) {
        logger.error('批量压缩失败', error, { imagePath });
        results.push({
          original: imagePath,
          compressed: imagePath,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 选择并压缩图片
   */
  async chooseAndCompress(options = {}) {
    const {
      count = 1,
      sourceType = ['album', 'camera'],
      sizeType = ['original'],
      ...compressOptions
    } = options;
    
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count,
        sourceType,
        sizeType,
        success: async (res) => {
          try {
            // 压缩所有选中的图片
            const compressedPaths = await Promise.all(
              res.tempFilePaths.map(path => this.compress(path, compressOptions))
            );
            
            resolve({
              tempFilePaths: compressedPaths,
              tempFiles: res.tempFiles
            });
          } catch (error) {
            logger.error('选择并压缩图片失败', error);
            reject(error);
          }
        },
        fail: reject
      });
    });
  }
  
  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * 获取推荐配置
   * 根据不同场景返回推荐的压缩配置
   */
  getRecommendedConfig(scenario = 'default') {
    const configs = {
      // 默认配置：适合一般用途
      default: {
        quality: 80,
        maxWidth: 1200,
        maxHeight: 1200,
        maxSize: 500 * 1024
      },
      
      // 头像配置：小尺寸高质量
      avatar: {
        quality: 85,
        maxWidth: 500,
        maxHeight: 500,
        maxSize: 200 * 1024
      },
      
      // 错题图片：保持清晰度
      mistake: {
        quality: 85,
        maxWidth: 1500,
        maxHeight: 1500,
        maxSize: 800 * 1024
      },
      
      // 缩略图：极小尺寸
      thumbnail: {
        quality: 70,
        maxWidth: 300,
        maxHeight: 300,
        maxSize: 100 * 1024
      }
    };
    
    return configs[scenario] || configs.default;
  }
}

// 创建单例
const imageCompressor = new ImageCompressor();

module.exports = imageCompressor;

