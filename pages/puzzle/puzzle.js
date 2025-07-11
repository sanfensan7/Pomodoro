var app = getApp();
var shareHelper = require('../../utils/share-helper');

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
    ]
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
      isGameActive: true
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
