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
      // 振动反馈不可用
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
      // 振动反馈不可用
    }
  },

  // 获取提示
  getHint: function() {
    if (this.data.isShowingHint) {
      return;
    }

    if (!this.data.isGameActive) {
      wx.showToast({
        title: '游戏已暂停',
        icon: 'none'
      });
      return;
    }

    vibrate.buttonTap();

    wx.showLoading({
      title: '计算中...',
      mask: true
    });

    this.setData({ isShowingHint: true });

    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
      try {
        // 计算最优下一步
        const hint = this.calculateBestMove();

        wx.hideLoading();

        if (hint && hint.move) {
          this.setData({
            currentHint: hint,
            showHint: true,
            isShowingHint: false,
            hintsUsed: this.data.hintsUsed + 1,
            hintUsed: true
          });
          
          console.log('提示计算成功:', hint);
        } else {
          this.setData({ isShowingHint: false });
          wx.showToast({
            title: hint ? hint.message : '无法计算提示',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('计算提示失败:', error);
        wx.hideLoading();
        this.setData({ isShowingHint: false });
        wx.showToast({
          title: '计算失败: ' + error.message,
          icon: 'none',
          duration: 2000
        });
      }
    }, 100);
  },

  // 计算最优移动 - 改进的算法
  calculateBestMove: function() {
    try {
      const currentGrid = JSON.parse(JSON.stringify(this.data.puzzleGrid));
      const size = this.data.puzzleSize;
      const emptyPos = { ...this.data.emptyPosition };

      console.log('开始计算提示，当前棋盘:', currentGrid);
      console.log('空格位置:', emptyPos);

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
      console.log('可能的移动:', possibleMoves);

      if (possibleMoves.length === 0) {
        console.error('没有可用的移动');
        return {
          message: '无可用移动',
          detail: '当前状态无法移动',
          move: null,
          canApply: false
        };
      }

      // 使用改进的策略评估每个移动
      let bestMove = null;
      let bestScore = -999999;
      let bestReason = '';

      for (let move of possibleMoves) {
        const tileValue = currentGrid[move.row][move.col];
        
        // 计算综合评分
        const score = this.evaluateMove(currentGrid, move, emptyPos, size);
        const reason = this.getDetailedMovementReason(tileValue, move, size, currentGrid);

        console.log(`移动 ${tileValue} (${move.row},${move.col}): 分数=${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
          bestReason = reason;
        }
      }

      if (bestMove) {
        const tileValue = currentGrid[bestMove.row][bestMove.col];
        const direction = this.getMoveDirection(emptyPos, bestMove);

        console.log('最佳移动:', tileValue, direction, '原因:', bestReason);

        return {
          message: `💡 建议：移动数字 ${tileValue} ${direction}`,
          detail: bestReason,
          move: bestMove,
          canApply: true
        };
      }

      // 兜底
      console.warn('使用兜底策略');
      const fallbackMove = possibleMoves[0];
      const tileValue = currentGrid[fallbackMove.row][fallbackMove.col];
      const direction = this.getMoveDirection(emptyPos, fallbackMove);

      return {
        message: `建议移动数字 ${tileValue} ${direction}`,
        detail: '尝试这个移动看看',
        move: fallbackMove,
        canApply: true
      };
    } catch (error) {
      console.error('calculateBestMove 错误:', error);
      throw error;
    }
  },

  // 综合评估移动
  evaluateMove: function(grid, move, emptyPos, size) {
    const tileValue = grid[move.row][move.col];
    
    // 计算目标位置
    const targetRow = Math.floor((tileValue - 1) / size);
    const targetCol = (tileValue - 1) % size;
    
    let score = 0;
    
    // 1. 如果能移动到正确位置，最高优先级
    if (move.row === targetRow && move.col === targetCol) {
      score += 10000;
      console.log(`数字 ${tileValue} 可以移到正确位置!`);
    }
    
    // 2. 距离目标位置的距离（越近越好）
    const currentDist = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
    score += (size * 2 - currentDist) * 100;
    
    // 3. 如果在正确的行或列，加分
    if (move.row === targetRow) {
      score += 500;
    }
    if (move.col === targetCol) {
      score += 500;
    }
    
    // 4. 优先处理小数字（通常更容易归位）
    if (tileValue <= size * size / 2) {
      score += 50;
    }
    
    // 5. 检查是否会破坏已经正确的数字
    const wouldBreakCorrect = this.wouldBreakCorrectTiles(grid, emptyPos, move, size);
    if (wouldBreakCorrect) {
      score -= 2000; // 重度惩罚
    }
    
    return score;
  },

  // 检查移动是否会破坏已经正确的数字
  wouldBreakCorrectTiles: function(grid, emptyPos, move, size) {
    // 检查将要移动的数字当前是否在正确位置
    const tileValue = grid[move.row][move.col];
    const targetRow = Math.floor((tileValue - 1) / size);
    const targetCol = (tileValue - 1) % size;
    
    // 如果这个数字当前就在正确位置，移动它会破坏
    if (move.row === targetRow && move.col === targetCol) {
      return true;
    }
    
    return false;
  },

  // 获取详细的移动原因说明
  getDetailedMovementReason: function(tileValue, move, size, grid) {
    const targetRow = Math.floor((tileValue - 1) / size);
    const targetCol = (tileValue - 1) % size;

    // 如果能移到正确位置
    if (move.row === targetRow && move.col === targetCol) {
      return `✅ 数字 ${tileValue} 将移动到最终正确位置 (${targetRow + 1}, ${targetCol + 1})`;
    }

    // 如果在正确的行
    if (move.row === targetRow) {
      const colDiff = Math.abs(move.col - targetCol);
      return `➡️ 数字 ${tileValue} 在正确的行，还需移动 ${colDiff} 格`;
    }

    // 如果在正确的列
    if (move.col === targetCol) {
      const rowDiff = Math.abs(move.row - targetRow);
      return `⬇️ 数字 ${tileValue} 在正确的列，还需移动 ${rowDiff} 格`;
    }

    // 计算距离
    const distance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
    if (distance <= 2) {
      return `🎯 数字 ${tileValue} 距离目标位置很近，继续这个方向`;
    }

    return `🔄 移动数字 ${tileValue} 以便为其他数字腾出空间`;
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
