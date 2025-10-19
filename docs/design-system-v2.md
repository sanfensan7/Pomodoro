# 🎨 现代企业级设计系统 v2.0

## 📋 概览

本设计系统遵循**Material Design 3.0**和**iOS Human Interface Guidelines**，创建一个专业、现代、一致的用户界面。

---

## 🎯 设计原则

### 1. 简洁至上 (Simplicity First)
- 去除不必要的装饰元素
- 专注于内容和功能
- 使用负空间提升可读性

### 2. 一致性 (Consistency)
- 统一的视觉语言
- 可预测的交互模式
- 标准化的组件库

### 3. 层次分明 (Clear Hierarchy)
- 清晰的信息架构
- 视觉重量分配合理
- 引导用户关注重点

### 4. 无障碍 (Accessibility)
- 足够的色彩对比度
- 适当的字体大小
- 清晰的触控目标

### 5. 性能优先 (Performance First)
- 轻量级动画
- 优化的渲染
- 快速的响应

---

## 🎨 颜色系统

### 主题色
```css
--theme-color: #ff6b6b       /* 主色 - 热情活力 */
--theme-light: #ff8787       /* 主色浅 */
--theme-lighter: #ffa5a5     /* 主色更浅 */
--theme-dark: #e85555        /* 主色深 */
```

**使用场景**：
- 主要行动按钮
- 重点信息高亮
- 进度指示
- 选中状态

### 中性色 (灰度)
```css
--gray-50:  #f8f9fa    /* 背景 - 最浅 */
--gray-100: #f1f3f5    /* 背景 - 浅 */
--gray-200: #e9ecef    /* 分隔线 */
--gray-300: #dee2e6    /* 边框 */
--gray-400: #ced4da    /* 边框 - 深 */
--gray-500: #adb5bd    /* 图标 */
--gray-600: #868e96    /* 辅助文字 */
--gray-700: #495057    /* 次要文字 */
--gray-800: #343a40    /* 主要文字 */
--gray-900: #212529    /* 标题 */
```

### 语义色
```css
--color-success: #51cf66    /* 成功 - 绿色 */
--color-warning: #ffc107    /* 警告 - 黄色 */
--color-error: #ff6b6b      /* 错误 - 红色 */
--color-info: #339af0       /* 信息 - 蓝色 */
```

### 色彩对比度

所有文字色彩符合 WCAG 2.1 AA 标准：
- 正常文字：对比度 ≥ 4.5:1
- 大号文字：对比度 ≥ 3:1
- 图形UI：对比度 ≥ 3:1

---

## 📐 间距系统

### 8px 基准网格
所有间距都是 8px 的倍数（4rpx 的倍数）：

```css
--spacing-xs:  4rpx   (2px)   /* 极小间距 */
--spacing-sm:  8rpx   (4px)   /* 小间距 */
--spacing-md:  16rpx  (8px)   /* 中等间距 - 基准 */
--spacing-lg:  24rpx  (12px)  /* 大间距 */
--spacing-xl:  32rpx  (16px)  /* 超大间距 */
--spacing-2xl: 48rpx  (24px)  /* 2倍超大间距 */
--spacing-3xl: 64rpx  (32px)  /* 3倍超大间距 */
```

### 使用指南

| 场景 | 推荐间距 | 示例 |
|------|---------|------|
| 组件内元素 | 8-16rpx | 图标和文字之间 |
| 相关组件组 | 16-24rpx | 表单项之间 |
| 卡片padding | 24-32rpx | 卡片内边距 |
| 章节间隔 | 32-48rpx | 不同模块之间 |
| 页面边距 | 32rpx | 容器左右边距 |

---

## 📝 字体系统

### 字号 (Type Scale)

采用 1.25 的缩放比例：

```css
--font-xs:   20rpx  /* 辅助信息 */
--font-sm:   22rpx  /* 说明文字 */
--font-base: 24rpx  /* 正文 - 基准 */
--font-md:   26rpx  /* 强调文字 */
--font-lg:   28rpx  /* 小标题 */
--font-xl:   32rpx  /* 标题 */
--font-2xl:  36rpx  /* 大标题 */
--font-3xl:  40rpx  /* 特大标题 */
--font-4xl:  48rpx  /* 超大标题 */
```

### 字重 (Font Weight)

```css
--font-regular:  400    /* 常规 - 正文 */
--font-medium:   500    /* 中等 - 强调 */
--font-semibold: 600    /* 半粗 - 小标题 */
--font-bold:     700    /* 粗体 - 标题 */
```

### 行高 (Line Height)

```css
--leading-none:    1      /* 紧凑 - 标题 */
--leading-tight:   1.25   /* 较紧 - 副标题 */
--leading-normal:  1.5    /* 正常 - 正文 */
--leading-relaxed: 1.75   /* 宽松 - 长文本 */
```

### 文字层级示例

```
页面标题：    font-2xl, font-bold
章节标题：    font-xl, font-semibold
卡片标题：    font-lg, font-medium
正文内容：    font-base, font-regular
辅助说明：    font-sm, font-regular
提示信息：    font-xs, font-regular
```

---

## 🧩 组件规范

### 按钮 (Button)

**尺寸规范**：
- 小按钮：高度 56rpx，padding 8-16rpx
- 中按钮：高度 64rpx，padding 12-24rpx（默认）
- 大按钮：高度 80rpx，padding 16-32rpx

**类型**：
1. **主要按钮** (Primary)
   - 背景：主题渐变
   - 文字：白色
   - 阴影：shadow-sm
   - 用途：主要操作

2. **次要按钮** (Secondary)
   - 背景：gray-100
   - 文字：text-primary
   - 用途：次要操作

3. **幽灵按钮** (Ghost)
   - 背景：透明
   - 边框：gray-300
   - 用途：取消、返回

**交互状态**：
- hover: 提升阴影，上移 2rpx
- active: 下沉 1rpx
- disabled: 透明度 50%，cursor: not-allowed

### 卡片 (Card)

**基础样式**：
```css
background: white
border-radius: 16rpx (--radius-lg)
padding: 24rpx (--spacing-lg)
box-shadow: --shadow-sm
```

**特殊效果**：
- **毛玻璃卡片**：backdrop-filter: blur(20rpx)
- **悬浮效果**：hover 时提升阴影
- **点击反馈**：active 时缩小 98%

### 输入框 (Input)

```css
高度: 64rpx
padding: 16rpx
border: 1rpx solid gray-300
border-radius: 12rpx
```

**焦点状态**：
```css
border-color: theme-color
box-shadow: 0 0 0 3rpx rgba(255, 107, 107, 0.1)
```

### 标签 (Tag)

```css
padding: 4-12rpx
border-radius: --radius-full (9999rpx)
font-size: --font-xs
font-weight: --font-medium
```

---

## 🌗 阴影系统

### 层级与用途

```css
--shadow-xs:  微妙的分隔         /* 分隔线的替代 */
--shadow-sm:  卡片基础阴影        /* 默认卡片 */
--shadow-md:  悬浮状态           /* hover 状态 */
--shadow-lg:  弹出层             /* modal, dropdown */
--shadow-xl:  强调层             /* 重要提示 */
--shadow-2xl: 顶层              /* 全屏遮罩 */
```

### 阴影颜色

所有阴影使用**纯黑+低透明度**，而非灰色：
- 更自然的视觉效果
- 更好的兼容性
- 统一的视觉语言

---

## 🎭 动画系统

### 过渡时长

```css
--transition-fast:   150ms    /* 微交互 */
--transition-base:   200ms    /* 默认过渡 */
--transition-slow:   300ms    /* 页面元素 */
--transition-slower: 500ms    /* 复杂动画 */
```

### 缓动函数 (Easing)

```css
--ease-in:     cubic-bezier(0.4, 0, 1, 1)         /* 加速 */
--ease-out:    cubic-bezier(0, 0, 0.2, 1)         /* 减速 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)       /* 平滑 */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55) /* 弹性 */
```

### 预设动画

1. **淡入** (fade-in)
   - 用途：页面加载、内容出现
   - 时长：300ms

2. **滑入** (slide-up)
   - 用途：列表项、卡片出现
   - 时长：300ms
   - 距离：40rpx

3. **缩放** (scale-in)
   - 用途：模态框、弹窗
   - 时长：300ms
   - 缩放：0.9 → 1.0

4. **弹跳** (bounce-in)
   - 用途：成功提示、奖励动画
   - 时长：600ms

### 性能建议

✅ **推荐属性**（GPU加速）：
- transform
- opacity

❌ **避免动画**：
- width/height
- top/left
- margin/padding

---

## 📐 布局系统

### 网格系统

12列网格，间距 16rpx：
```
列宽 = (容器宽度 - 11 × 16rpx) / 12
```

### 响应式断点

```
小屏：  < 375px   (iPhone SE)
中屏：  375-414px (iPhone 8/X)
大屏：  > 414px   (iPhone Plus)
```

### 安全区域

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

---

## 🔲 圆角系统

```css
--radius-xs:   4rpx    /* 标签、小元素 */
--radius-sm:   8rpx    /* 按钮、输入框 */
--radius-md:   12rpx   /* 卡片内元素 */
--radius-lg:   16rpx   /* 卡片 */
--radius-xl:   20rpx   /* 大卡片 */
--radius-2xl:  24rpx   /* 特大元素 */
--radius-full: 9999rpx /* 圆形、胶囊 */
```

---

## 🎯 使用案例

### 示例：专注页面卡片

```css
.stats-card {
  background: var(--background-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  transition: box-shadow var(--transition-base);
}

.stats-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.card-value {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--theme-color);
}

.card-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
```

---

## ✅ 设计检查清单

### 视觉层级
- [ ] 标题和内容对比度足够
- [ ] 主要操作按钮突出
- [ ] 辅助信息视觉权重适中

### 间距
- [ ] 使用 8px 网格系统
- [ ] 相关元素紧密，无关元素分离
- [ ] 页面留白适当

### 色彩
- [ ] 主题色使用克制
- [ ] 色彩对比度符合WCAG标准
- [ ] 语义色使用正确

### 字体
- [ ] 字号符合层级
- [ ] 字重搭配合理
- [ ] 行高保证可读性

### 交互
- [ ] 所有交互元素有反馈
- [ ] 加载状态有提示
- [ ] 错误信息清晰

### 性能
- [ ] 动画使用 transform 和 opacity
- [ ] 避免频繁重绘
- [ ] 图片适当压缩

---

## 📚 参考资源

- [Material Design 3.0](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**版本**: 2.0  
**更新日期**: 2025-10-19  
**状态**: ✅ 已实施

