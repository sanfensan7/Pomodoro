/**
 * 震动反馈工具类
 * 提供统一的震动反馈功能
 */

class VibrateManager {
  constructor() {
    this.isEnabled = this.getVibrateEnabled();
  }

  // 获取震动设置状态
  getVibrateEnabled() {
    try {
      const enabled = wx.getStorageSync('vibrateEnabled');
      return enabled !== false; // 默认启用
    } catch (e) {
      console.error('获取震动设置失败:', e);
      return true; // 默认启用
    }
  }

  // 更新震动设置状态
  updateVibrateEnabled() {
    this.isEnabled = this.getVibrateEnabled();
  }

  // 轻微震动 - 用于按钮点击
  light() {
    if (!this.isEnabled) return;
    
    try {
      wx.vibrateShort({
        type: 'light'
      });
    } catch (e) {
      console.error('轻微震动失败:', e);
    }
  }

  // 中等震动 - 用于重要操作
  medium() {
    if (!this.isEnabled) return;
    
    try {
      wx.vibrateShort({
        type: 'medium'
      });
    } catch (e) {
      console.error('中等震动失败:', e);
    }
  }

  // 强烈震动 - 用于警告或完成
  heavy() {
    if (!this.isEnabled) return;
    
    try {
      wx.vibrateShort({
        type: 'heavy'
      });
    } catch (e) {
      console.error('强烈震动失败:', e);
    }
  }

  // 长震动 - 用于特殊提醒
  long() {
    if (!this.isEnabled) return;
    
    try {
      wx.vibrateLong();
    } catch (e) {
      console.error('长震动失败:', e);
    }
  }

  // 按钮点击震动 - 最常用的震动类型
  buttonTap() {
    this.light();
  }

  // 成功操作震动
  success() {
    this.medium();
  }

  // 错误操作震动
  error() {
    this.heavy();
  }

  // 警告震动
  warning() {
    this.medium();
  }

  // 完成震动
  complete() {
    this.heavy();
  }
}

// 创建全局实例
const vibrateManager = new VibrateManager();

// 导出便捷方法
module.exports = {
  // 实例
  vibrateManager,
  
  // 便捷方法
  buttonTap: () => vibrateManager.buttonTap(),
  success: () => vibrateManager.success(),
  error: () => vibrateManager.error(),
  warning: () => vibrateManager.warning(),
  complete: () => vibrateManager.complete(),
  light: () => vibrateManager.light(),
  medium: () => vibrateManager.medium(),
  heavy: () => vibrateManager.heavy(),
  long: () => vibrateManager.long(),
  
  // 更新设置
  updateSettings: () => vibrateManager.updateVibrateEnabled()
};
