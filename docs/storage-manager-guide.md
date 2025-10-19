# 📦 存储管理器使用指南

## 🎯 为什么要使用存储管理器？

在v1.2.5之前，项目中有**30+个不同的存储键**分散在各个文件中：
```javascript
wx.getStorageSync('tasks')
wx.getStorageSync('todayStats')
wx.getStorageSync('themeColor')
// ... 还有27个以上
```

这导致了：
- ❌ 数据键名分散，难以管理
- ❌ 没有版本控制，升级困难
- ❌ 数据迁移需要手动处理
- ❌ 容易出现拼写错误
- ❌ 没有统一的错误处理

**现在，使用 StorageManager 统一管理！**

---

## 🚀 快速开始

### 1. 引入存储管理器

```javascript
const storageManager = require('../../utils/storage-manager');
```

### 2. 基本使用

#### ✅ 读取数据

```javascript
// ❌ 旧方式
const tasks = wx.getStorageSync('tasks') || [];

// ✅ 新方式
const tasks = storageManager.get('tasks', []);
```

**优势：**
- 自动处理空值
- 统一的错误处理
- 自动日志记录

#### ✅ 写入数据

```javascript
// ❌ 旧方式
wx.setStorageSync('tasks', tasks);

// ✅ 新方式
storageManager.set('tasks', tasks);
```

**优势：**
- 自动捕获异常
- 返回成功/失败状态
- 自动日志记录

#### ✅ 删除数据

```javascript
// ❌ 旧方式
wx.removeStorageSync('tasks');

// ✅ 新方式
storageManager.remove('tasks');
```

---

## 🎨 高级功能

### 1. 批量操作

#### 批量读取
```javascript
// 一次读取多个数据
const data = storageManager.getBatch([
  'tasks',
  'todayStats',
  'themeColor'
]);

console.log(data);
// {
//   tasks: [...],
//   todayStats: {...},
//   themeColor: '#ff6b6b'
// }
```

#### 批量写入
```javascript
// 一次写入多个数据
storageManager.setBatch({
  tasks: [],
  todayStats: { completed: 0, focusTime: 0 },
  themeColor: '#ff6b6b'
});
```

**优势：** 减少存储操作次数，提升性能

---

### 2. 数据键常量

使用预定义的键常量，避免拼写错误：

```javascript
// ❌ 容易拼写错误
const stats = storageManager.get('todayStat'); // 少了s

// ✅ 使用常量
const stats = storageManager.get(storageManager.keys.TODAY_STATS);
```

**可用的键常量：**
```javascript
storageManager.keys = {
  // 专注相关
  FOCUS_DURATION: 'focusDuration',
  SHORT_BREAK_DURATION: 'shortBreakDuration',
  LONG_BREAK_DURATION: 'longBreakDuration',
  
  // 统计数据
  TODAY_STATS: 'todayStats',
  WEEK_STATS: 'weekStats',
  ALL_DAY_STATS: 'allDayStats',
  FOCUS_HISTORY: 'focusHistory',
  FOCUS_STATS: 'focusStats',
  
  // 任务相关
  TASKS: 'tasks',
  CURRENT_TASK: 'currentTask',
  
  // 错题本
  MISTAKES: 'mistakes',
  SUBJECTS: 'subjects',
  
  // 设置
  THEME_COLOR: 'themeColor',
  TIMER_STYLE: 'timerStyle',
  // ... 还有20+个键
}
```

---

### 3. 存储信息查询

```javascript
const info = storageManager.getStorageInfo();

console.log(info);
// {
//   keys: ['tasks', 'todayStats', ...],  // 所有键
//   currentSize: 1024,                    // 当前大小(KB)
//   limitSize: 10240,                     // 最大限制(KB)
//   usage: '10.00%'                       // 使用率
// }
```

**用途：**
- 监控存储使用情况
- 警告用户存储空间不足
- 优化数据存储策略

---

### 4. 数据备份与恢复

#### 导出所有数据（备份）
```javascript
const backup = storageManager.exportData();

console.log(backup);
// {
//   version: '1.2.5',
//   exportTime: '2025-10-19T12:00:00.000Z',
//   data: {
//     tasks: [...],
//     todayStats: {...},
//     // ... 所有数据
//   }
// }

// 可以保存到服务器或分享给用户
```

#### 导入数据（恢复）
```javascript
// 从备份恢复数据
const success = storageManager.importData(backup);

if (success) {
  wx.showToast({ title: '数据恢复成功' });
}
```

**应用场景：**
- 更换设备
- 数据迁移
- 重置后恢复
- 云同步

---

### 5. 清空数据

```javascript
// 清空所有数据，但保留设置
storageManager.clearAll(true);

// 清空所有数据，包括设置
storageManager.clearAll(false);
```

**用途：**
- 重置应用
- 测试时清理数据
- 用户注销

---

## 🔄 数据迁移

### 自动版本检测与迁移

StorageManager 会在应用启动时自动执行：

```javascript
// app.js - onLaunch
storageManager.checkVersion();
```

**迁移过程：**
1. 读取保存的版本号
2. 对比当前版本号
3. 执行必要的数据迁移
4. 保存新版本号

**示例：v1.2.4 迁移**
```javascript
migrateToV124() {
  // 修复历史数据的时间单位问题
  const todayStats = this.get('todayStats');
  
  // 如果 focusTime 小于10，很可能是小时，转换为分钟
  if (todayStats && todayStats.focusTime < 10) {
    todayStats.focusTime = todayStats.focusTime * 60;
    this.set('todayStats', todayStats);
    logger.log('修复 todayStats 时间单位');
  }
}
```

---

## 📝 迁移到存储管理器

### 逐步迁移计划

**阶段1：新功能使用存储管理器**
```javascript
// 新功能直接使用
const goalManager = {
  saveGoal(goal) {
    storageManager.set('dailyGoal', goal);
  }
}
```

**阶段2：重构现有代码**
```javascript
// ❌ 旧代码
loadTasks: function() {
  const tasks = wx.getStorageSync('tasks') || [];
  this.setData({ tasks });
}

// ✅ 新代码
loadTasks: function() {
  const tasks = storageManager.get('tasks', []);
  this.setData({ tasks });
}
```

**阶段3：使用键常量**
```javascript
// ✅ 最佳实践
const tasks = storageManager.get(storageManager.keys.TASKS, []);
```

---

## 💡 最佳实践

### 1. 始终提供默认值
```javascript
// ✅ 好
const tasks = storageManager.get('tasks', []);

// ❌ 不好
const tasks = storageManager.get('tasks'); // 可能是 null
```

### 2. 检查操作结果
```javascript
const success = storageManager.set('tasks', tasks);
if (!success) {
  wx.showToast({ title: '保存失败', icon: 'error' });
}
```

### 3. 批量操作优先
```javascript
// ✅ 好：一次批量写入
storageManager.setBatch({
  tasks: [],
  todayStats: {},
  weekStats: {}
});

// ❌ 不好：多次单独写入
storageManager.set('tasks', []);
storageManager.set('todayStats', {});
storageManager.set('weekStats', {});
```

### 4. 使用键常量避免错误
```javascript
// ✅ 好：使用常量
const { TASKS, TODAY_STATS } = storageManager.keys;
const tasks = storageManager.get(TASKS);

// ❌ 不好：硬编码字符串
const tasks = storageManager.get('taks'); // 拼写错误！
```

---

## 🐛 故障排查

### 问题1：数据读取为 null
```javascript
// 检查是否提供了默认值
const tasks = storageManager.get('tasks', []); // ✅

// 检查键名是否正确
const tasks = storageManager.get('task'); // ❌ 应该是 'tasks'
```

### 问题2：数据写入失败
```javascript
// 检查数据大小
const info = storageManager.getStorageInfo();
if (info.usage > '90%') {
  console.warn('存储空间不足');
}

// 检查数据是否可序列化
const data = {
  tasks: [...],
  circular: data // ❌ 循环引用
};
```

### 问题3：版本迁移问题
```javascript
// 查看迁移日志
const logger = require('./utils/logger');
logger.debug(true);

// 手动触发迁移
storageManager.migrate('1.2.3', '1.2.5');
```

---

## 📚 API 参考

### 核心方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `get(key, defaultValue)` | key: string, defaultValue: any | any | 读取数据 |
| `set(key, value)` | key: string, value: any | boolean | 写入数据 |
| `remove(key)` | key: string | boolean | 删除数据 |
| `getBatch(keys)` | keys: string[] | Object | 批量读取 |
| `setBatch(data)` | data: Object | boolean | 批量写入 |
| `clearAll(keepSettings)` | keepSettings: boolean | boolean | 清空数据 |
| `getStorageInfo()` | - | Object | 存储信息 |
| `exportData()` | - | Object | 导出备份 |
| `importData(backup)` | backup: Object | boolean | 导入恢复 |

### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `keys` | Object | 所有预定义的键常量 |
| `version` | string | 当前版本号 |
| `namespace` | string | 命名空间前缀 |

---

## 🎉 总结

使用 StorageManager 的好处：

1. ✅ **统一管理** - 所有数据键集中管理
2. ✅ **自动迁移** - 版本升级自动处理
3. ✅ **错误处理** - 统一的异常捕获
4. ✅ **日志记录** - 自动记录操作
5. ✅ **类型安全** - 使用键常量避免错误
6. ✅ **批量操作** - 提升性能
7. ✅ **备份恢复** - 轻松实现数据迁移

**立即开始使用，让数据管理更简单！** 🚀

---

**版本：** v1.2.5  
**更新日期：** 2025-10-19

