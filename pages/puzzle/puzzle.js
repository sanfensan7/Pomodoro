var app = getApp();
var shareHelper = require('../../utils/share-helper');
var vibrate = require('../../utils/vibrate');

Page({
  data: {
    themeColor: '#ff6b6b',
    gameState: 'menu', // menu, playing, completed
    difficulty: 3, // 3x3, 4x4, 5x5
    puzzleSize: 3,
    puzzleGrid: [],
    emptyPosition: { row: 2, col: 2 },
    moves: 0,
    startTime: null,
    gameTime: 0,
    timer: null,
    isGameActive: false,
    bestRecords: {
      3: { moves: null, time: null },
      4: { moves: null, time: null },
      5: { moves: null, time: null }
    },
    difficultyOptions: [
      { value: 3, label: '简单 (3×3)' },
      { value: 4, label: '中等 (4×4)' },
      { value: 5, label: '困难 (5×5)' }
    ],

    // 提示系统相关
    hintsUsed: 0,
    showHint: false,
    isShowingHint: false,
    currentHint: null,
    hintUsed: false
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

    // 加载最佳记录
    this.loadBestRecords();
  },

  onShow: function() {
    // 更新主题色
    if (app.globalData.themeColor !== this.data.themeColor) {
      this.setData({
        themeColor: app.globalData.themeColor
      });
    }
  },

  onUnload: function() {
    // 清除计时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  loadBestRecords: function() {
    var records = wx.getStorageSync('puzzleBestRecords') || {
      3: { moves: null, time: null },
      4: { moves: null, time: null },
      5: { moves: null, time: null }
    };
    this.setData({
      bestRecords: records
    });
  },

  saveBestRecord: function(difficulty, moves, time) {
    var records = this.data.bestRecords;
    var current = records[difficulty];
    
    var isNewRecord = false;
    if (!current.moves || moves < current.moves || 
        (moves === current.moves && time < current.time)) {
      records[difficulty] = { moves: moves, time: time };
      isNewRecord = true;
    }

    this.setData({
      bestRecords: records
    });
    wx.setStorageSync('puzzleBestRecords', records);

    return isNewRecord;
  },

  selectDifficulty: function(e) {
    var difficulty = parseInt(e.currentTarget.dataset.difficulty);
    this.setData({
      difficulty: difficulty,
      puzzleSize: difficulty
    });
  },

  startGame: function() {
    this.setData({
      gameState: 'playing',
      moves: 0,
      gameTime: 0,
      startTime: Date.now(),
      isGameActive: true,
      // 重置提示相关数据
      hintsUsed: 0,
      showHint: false,
      isShowingHint: false,
      currentHint: null,
      hintUsed: false
    });

    this.initPuzzle();
    this.startTimer();
  },

  initPuzzle: function() {
    var size = this.data.puzzleSize;
    var grid = [];
    
    // 创建已完成的拼图
    for (var i = 0; i < size; i++) {
      var row = [];
      for (var j = 0; j < size; j++) {
        if (i === size - 1 && j === size - 1) {
          row.push(0); // 空格
        } else {
          row.push(i * size + j + 1);
        }
      }
      grid.push(row);
    }

    // 打乱拼图
    this.shufflePuzzle(grid, size);

    this.setData({
      puzzleGrid: grid,
      emptyPosition: this.findEmptyPosition(grid, size)
    });
  },

  shufflePuzzle: function(grid, size) {
    var moves = 1000; // 执行1000次随机移动来打乱
    var emptyPos = { row: size - 1, col: size - 1 };

    for (var i = 0; i < moves; i++) {
      var directions = this.getValidMoves(emptyPos, size);
      var randomDir = directions[Math.floor(Math.random() * directions.length)];
      
      // 交换空格和相邻数字
      var newRow = emptyPos.row + randomDir.row;
      var newCol = emptyPos.col + randomDir.col;
      
      grid[emptyPos.row][emptyPos.col] = grid[newRow][newCol];
      grid[newRow][newCol] = 0;
      
      emptyPos = { row: newRow, col: newCol };
    }
  },

  getValidMoves: function(emptyPos, size) {
    var directions = [];
    var row = emptyPos.row;
    var col = emptyPos.col;

    if (row > 0) directions.push({ row: -1, col: 0 }); // 上
    if (row < size - 1) directions.push({ row: 1, col: 0 }); // 下
    if (col > 0) directions.push({ row: 0, col: -1 }); // 左
    if (col < size - 1) directions.push({ row: 0, col: 1 }); // 右

    return directions;
  },

  findEmptyPosition: function(grid, size) {
    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        if (grid[i][j] === 0) {
          return { row: i, col: j };
        }
      }
    }
  },

  moveTile: function(e) {
    if (!this.data.isGameActive) return;

    var row = parseInt(e.currentTarget.dataset.row);
    var col = parseInt(e.currentTarget.dataset.col);
    var emptyPos = this.data.emptyPosition;

    // 检查是否可以移动（与空格相邻）
    var canMove = (Math.abs(row - emptyPos.row) === 1 && col === emptyPos.col) ||
                  (Math.abs(col - emptyPos.col) === 1 && row === emptyPos.row);

    if (!canMove) return;

    // 执行移动
    var grid = this.data.puzzleGrid;
    grid[emptyPos.row][emptyPos.col] = grid[row][col];
    grid[row][col] = 0;

    var newMoves = this.data.moves + 1;

    this.setData({
      puzzleGrid: grid,
      emptyPosition: { row: row, col: col },
      moves: newMoves
    });

    // 播放移动音效
    this.playMoveSound();

    // 检查是否完成
    if (this.checkWin()) {
      this.completeGame();
    }
  },

  checkWin: function() {
    var grid = this.data.puzzleGrid;
    var size = this.data.puzzleSize;
    
    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        var expectedValue = (i === size - 1 && j === size - 1) ? 0 : i * size + j + 1;
        if (grid[i][j] !== expectedValue) {
          return false;
        }
      }
    }
    return true;
  },

  completeGame: function() {
    this.setData({
      gameState: 'completed',
      isGameActive: false
    });

    // 停止计时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    var finalTime = this.data.gameTime;
    var finalMoves = this.data.moves;
    var difficulty = this.data.difficulty;

    // 检查是否创造新记录
    var isNewRecord = this.saveBestRecord(difficulty, finalMoves, finalTime);

    // 播放完成音效
    this.playCompleteSound();

    // 显示完成提示
    var self = this;
    setTimeout(function() {
      wx.showModal({
        title: '🎉 恭喜完成！',
        content: '用时：' + self.formatTime(finalTime) + '\n' +
                '步数：' + finalMoves + '\n' +
                (isNewRecord ? '🏆 创造新记录！' : ''),
        confirmText: '再来一局',
        cancelText: '返回菜单',
        success: function(res) {
          if (res.confirm) {
            self.startGame();
          } else {
            self.backToMenu();
          }
        }
      });
    }, 500);
  },

  startTimer: function() {
    var self = this;
    this.data.timer = setInterval(function() {
      if (self.data.isGameActive) {
        var currentTime = Math.floor((Date.now() - self.data.startTime) / 1000);
        self.setData({
          gameTime: currentTime
        });
      }
    }, 1000);
  },

  pauseGame: function() {
    this.setData({
      isGameActive: !this.data.isGameActive
    });
  },

  restartGame: function() {
    var self = this;
    wx.showModal({
      title: '确认重新开始',
      content: '当前进度将会丢失，确定要重新开始吗？',
      success: function(res) {
        if (res.confirm) {
          self.startGame();
        }
      }
    });
  },

  backToMenu: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    this.setData({
      gameState: 'menu',
      isGameActive: false,
      moves: 0,
      gameTime: 0
    });
  },

  formatTime: function(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    return (minutes < 10 ? '0' : '') + minutes + ':' + 
           (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
  },

  playMoveSound: function() {
    // 播放移动音效 - 使用系统音效或简单的振动反馈
    try {
      wx.vibrateShort({
        type: 'light'
      });
    } catch (e) {
      console.log('振动反馈不可用');
    }
  },

  playCompleteSound: function() {
    // 播放完成音效 - 使用系统音效或振动反馈
    try {
      wx.vibrateShort({
        type: 'heavy'
      });
      setTimeout(function() {
        wx.vibrateShort({
          type: 'heavy'
        });
      }, 200);
    } catch (e) {
      console.log('振动反馈不可用');
    }
  },

  // 获取提示
  getHint: function() {
    if (this.data.isShowingHint) {
      return;
    }

    vibrate.buttonTap();

    this.setData({ isShowingHint: true });

    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
      try {
        // 计算最优下一步
        const hint = this.calculateBestMove();

        console.log('提示计算结果:', hint);

        if (hint) {
          this.setData({
            currentHint: hint,
            showHint: true,
            isShowingHint: false,
            hintsUsed: this.data.hintsUsed + 1,
            hintUsed: true
          });
        } else {
          // 这种情况现在应该不会发生，因为我们总是返回一个提示
          this.setData({ isShowingHint: false });
          wx.showToast({
            title: '无法计算提示',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('计算提示失败:', error);
        this.setData({ isShowingHint: false });
        wx.showToast({
          title: '提示计算失败',
          icon: 'none'
        });
      }
    }, 100);
  },

  // 计算最优移动 - 重新设计的简化版本
  calculateBestMove: function() {
    const currentGrid = this.data.puzzleGrid;
    const size = this.data.puzzleSize;
    const emptyPos = this.data.emptyPosition;

    // 检查游戏是否已完成
    if (this.checkWin()) {
      return {
        message: '🎉 恭喜！拼图已完成！',
        detail: '所有数字都已归位',
        move: null,
        canApply: false
      };
    }

    // 获取所有可能的移动
    const possibleMoves = this.getPossibleMoves(emptyPos, size);

    if (possibleMoves.length === 0) {
      return {
        message: '无可用移动',
        detail: '当前状态无法移动',
        move: null,
        canApply: false
      };
    }

    // 使用简单但有效的策略：找到最需要归位的数字
    let bestMove = null;
    let bestPriority = -1;
    let bestReason = '';

    for (let move of possibleMoves) {
      const tileValue = currentGrid[move.row][move.col];
      const priority = this.calculateMovePriority(tileValue, move, size);
      const reason = this.getSimpleMovementReason(tileValue, move, size);

      if (priority > bestPriority) {
        bestPriority = priority;
        bestMove = move;
        bestReason = reason;
      }
    }

    if (bestMove) {
      const tileValue = currentGrid[bestMove.row][bestMove.col];
      const direction = this.getMoveDirection(emptyPos, bestMove);

      return {
        message: `建议移动数字 ${tileValue} ${direction}`,
        detail: bestReason,
        move: bestMove,
        canApply: true
      };
    }

    // 兜底：返回第一个可用移动
    const fallbackMove = possibleMoves[0];
    const tileValue = currentGrid[fallbackMove.row][fallbackMove.col];
    const direction = this.getMoveDirection(emptyPos, fallbackMove);

    return {
      message: `建议移动数字 ${tileValue} ${direction}`,
      detail: '尝试这个移动',
      move: fallbackMove,
      canApply: true
    };
  },

  // 计算移动优先级 - 简化的评分系统
  calculateMovePriority: function(tileValue, move, size) {
    // 计算目标位置
    const targetRow = Math.floor((tileValue - 1) / size);
    const targetCol = (tileValue - 1) % size;

    // 计算当前距离目标位置的距离
    const currentDistance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);

    // 优先级计算：
    // 1. 如果能直接到达目标位置，最高优先级
    if (move.row === targetRow && move.col === targetCol) {
      return 1000;
    }

    // 2. 如果能到达正确的行或列，高优先级
    if (move.row === targetRow) {
      return 500 + (size - Math.abs(move.col - targetCol));
    }
    if (move.col === targetCol) {
      return 500 + (size - Math.abs(move.row - targetRow));
    }

    // 3. 距离目标位置越近，优先级越高
    return 100 - currentDistance;
  },

  // 获取简单的移动原因说明
  getSimpleMovementReason: function(tileValue, move, size) {
    const targetRow = Math.floor((tileValue - 1) / size);
    const targetCol = (tileValue - 1) % size;

    // 检查是否移动到正确位置
    if (move.row === targetRow && move.col === targetCol) {
      return `✅ 将数字 ${tileValue} 放到正确位置`;
    }

    // 检查是否移动到正确行或列
    if (move.row === targetRow) {
      return `➡️ 将数字 ${tileValue} 移动到正确的行`;
    }

    if (move.col === targetCol) {
      return `⬇️ 将数字 ${tileValue} 移动到正确的列`;
    }

    // 计算距离改善
    const currentDistance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
    if (currentDistance <= 2) {
      return `🎯 让数字 ${tileValue} 更接近目标位置`;
    }

    return `🔄 移动数字 ${tileValue} 为后续步骤做准备`;
  },





  // 生成目标网格
  generateTargetGrid: function(size) {
    const grid = [];
    let num = 1;

    for (let i = 0; i < size; i++) {
      grid[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === size - 1 && j === size - 1) {
          grid[i][j] = 0; // 空格在右下角
        } else {
          grid[i][j] = num++;
        }
      }
    }

    return grid;
  },

  // 计算曼哈顿距离
  calculateManhattanDistance: function(currentGrid, targetGrid, size) {
    let distance = 0;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const value = currentGrid[i][j];
        if (value !== 0) {
          // 直接计算目标位置，避免嵌套循环
          const targetRow = Math.floor((value - 1) / size);
          const targetCol = (value - 1) % size;

          // 计算曼哈顿距离
          distance += Math.abs(i - targetRow) + Math.abs(j - targetCol);
        }
      }
    }

    return distance;
  },

  // 获取可能的移动
  getPossibleMoves: function(emptyPos, size) {
    const moves = [];
    const directions = [
      { row: -1, col: 0 }, // 上
      { row: 1, col: 0 },  // 下
      { row: 0, col: -1 }, // 左
      { row: 0, col: 1 }   // 右
    ];

    for (let dir of directions) {
      const newRow = emptyPos.row + dir.row;
      const newCol = emptyPos.col + dir.col;

      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  },

  // 模拟移动
  simulateMove: function(grid, emptyPos, move, size) {
    const newGrid = grid.map(row => [...row]);

    // 交换空格和目标位置
    newGrid[emptyPos.row][emptyPos.col] = newGrid[move.row][move.col];
    newGrid[move.row][move.col] = 0;

    return newGrid;
  },

  // 计算移动分数
  calculateMoveScore: function(grid, move, size) {
    const value = grid[move.row][move.col];

    // 计算该数字到目标位置的距离
    const targetRow = Math.floor((value - 1) / size);
    const targetCol = (value - 1) % size;

    const currentDistance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);

    let score = size * 2 - currentDistance;

    // 额外策略：优先移动已经在正确行或列的数字
    if (move.row === targetRow || move.col === targetCol) {
      score += 5;
    }

    // 优先移动小数字（通常更容易放到正确位置）
    if (value <= size) {
      score += 3;
    }

    // 检查是否会形成连续序列
    if (this.wouldCreateSequence(grid, move, value, size)) {
      score += 10;
    }

    return score;
  },

  // 检查移动是否会创建连续序列
  wouldCreateSequence: function(grid, move, value, size) {
    // 检查水平和垂直方向是否会形成连续的数字序列
    const directions = [
      { row: 0, col: 1 },  // 右
      { row: 0, col: -1 }, // 左
      { row: 1, col: 0 },  // 下
      { row: -1, col: 0 }  // 上
    ];

    for (let dir of directions) {
      const nextRow = move.row + dir.row;
      const nextCol = move.col + dir.col;

      if (nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size) {
        const nextValue = grid[nextRow][nextCol];
        if (nextValue === value + 1 || nextValue === value - 1) {
          return true;
        }
      }
    }

    return false;
  },

  // 获取移动方向描述
  getMoveDirection: function(emptyPos, move) {
    if (move.row < emptyPos.row) return '向上';
    if (move.row > emptyPos.row) return '向下';
    if (move.col < emptyPos.col) return '向左';
    if (move.col > emptyPos.col) return '向右';
    return '';
  },

  // 关闭提示
  closeHint: function() {
    vibrate.buttonTap();

    this.setData({
      showHint: false,
      currentHint: null
    });
  },

  // 应用提示（自动执行移动）
  applyHint: function() {
    if (!this.data.currentHint || !this.data.currentHint.canApply) {
      return;
    }

    vibrate.buttonTap();

    const move = this.data.currentHint.move;

    // 执行移动
    this.moveTile({
      currentTarget: {
        dataset: {
          row: move.row,
          col: move.col
        }
      }
    });

    // 关闭提示
    this.closeHint();

    wx.showToast({
      title: '已自动执行提示',
      icon: 'success'
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    var difficulty = this.data.difficulty;
    var difficultyText = difficulty === 3 ? '简单' : difficulty === 4 ? '中等' : '困难';

    return {
      title: '我在玩拼图游戏(' + difficultyText + ')，快来挑战吧！',
      path: '/pages/puzzle/puzzle',
      imageUrl: ''
    };
  },

  onShareTimeline: function() {
    return shareHelper.getShareTimelineConfig('total');
  }
});
