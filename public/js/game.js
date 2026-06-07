/**
 * Neon Gomoku - 游戏核心逻辑
 */

class GomokuGame {
  constructor() {
    // 棋盘配置
    this.BOARD_SIZE = 15;
    this.EMPTY = 0;
    this.BLACK = 1;
    this.WHITE = 2;
    
    // 游戏状态
    this.board = [];
    this.currentPlayer = this.BLACK;
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    
    // Canvas 配置
    this.boardCanvas = document.getElementById('boardCanvas');
    this.boardCtx = this.boardCanvas.getContext('2d');
    this.effectsCanvas = document.getElementById('effectsCanvas');
    
    // 视觉效果引擎
    this.effects = new EffectsEngine(this.effectsCanvas);
    
    // 响应式配置
    this.cellSize = 0;
    this.padding = 0;
    
    // 颜色配置
    this.colors = {
      boardBg: '#1a1a2e',
      gridLine: 'rgba(0, 247, 255, 0.3)',
      gridLineGlow: 'rgba(0, 247, 255, 0.1)',
      starPoint: 'rgba(139, 92, 246, 0.8)',
      blackStone: '#1a1a1a',
      blackStoneHighlight: 'rgba(60, 60, 60, 0.8)',
      whiteStone: '#f0f0f0',
      whiteStoneHighlight: 'rgba(255, 255, 255, 0.9)',
      lastMoveMarker: 'rgba(0, 247, 255, 0.8)',
      winLine: 'rgba(255, 0, 255, 0.8)',
      hoverValid: 'rgba(0, 247, 255, 0.15)',
      hoverInvalid: 'rgba(255, 0, 0, 0.15)'
    };
    
    // 绑定事件
    this.init();
  }

  init() {
    this.initBoard();
    this.resize();
    this.setupEventListeners();
    this.effects.start();
    this.render();
    
    window.addEventListener('resize', () => {
      this.resize();
      this.render();
    });
  }

  // 初始化棋盘
  initBoard() {
    this.board = Array(this.BOARD_SIZE).fill(null)
      .map(() => Array(this.BOARD_SIZE).fill(this.EMPTY));
    this.currentPlayer = this.BLACK;
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.updateUI();
  }

  // 响应式调整
  resize() {
    const container = this.boardCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    const maxSize = Math.min(rect.width, rect.height, 6000);
    
    // 设置画布尺寸
    const dpr = window.devicePixelRatio || 1;
    this.boardCanvas.width = maxSize * dpr;
    this.boardCanvas.height = maxSize * dpr;
    this.boardCanvas.style.width = maxSize + 'px';
    this.boardCanvas.style.height = maxSize + 'px';
    
    // 同步特效画布
    this.effectsCanvas.width = maxSize * dpr;
    this.effectsCanvas.height = maxSize * dpr;
    this.effectsCanvas.style.width = maxSize + 'px';
    this.effectsCanvas.style.height = maxSize + 'px';
    
    // 重置变换避免累积（修复居中问题）
    this.boardCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.boardCtx.scale(dpr, dpr);
    
    // 计算格子大小：分成 BOARD_SIZE+1 份，使棋子落在交叉点上
    this.boardSize = maxSize;
    this.cellSize = maxSize / (this.BOARD_SIZE + 1);
    this.padding = this.cellSize;
  }

  // 设置事件监听
  setupEventListeners() {
    // 落子事件
    this.boardCanvas.addEventListener('click', (e) => this.handleClick(e));
    this.boardCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleClick(e);
    });
    
    // 悬停效果（仅桌面端）
    if ('ontouchstart' in window === false) {
      this.boardCanvas.addEventListener('mousemove', (e) => this.handleHover(e));
      this.boardCanvas.addEventListener('mouseleave', () => this.render());
    }
    
    // 按钮事件
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('playAgainBtn').addEventListener('click', () => this.reset());
  }

  // 处理点击
  handleClick(e) {
    if (this.gameOver) return;
    
    const rect = this.boardCanvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.changedTouches) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // 转换为棋盘坐标（交叉点）
    const col = Math.round(x / this.cellSize) - 1;
    const row = Math.round(y / this.cellSize) - 1;
    
    // 尝试落子
    this.placeStone(row, col);
  }

  // 处理悬停
  handleHover(e) {
    if (this.gameOver) return;
    
    const rect = this.boardCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round(x / this.cellSize) - 1;
    const row = Math.round(y / this.cellSize) - 1;
    
    this.render();
    
    // 绘制悬停效果
    if (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
      if (this.board[row][col] === this.EMPTY) {
        const posX = (col + 1) * this.cellSize;
        const posY = (row + 1) * this.cellSize;
        
        this.boardCtx.save();
        this.boardCtx.globalAlpha = 0.5;
        this.boardCtx.fillStyle = this.currentPlayer === this.BLACK ? 
          this.colors.blackStone : this.colors.whiteStone;
        this.boardCtx.shadowColor = this.currentPlayer === this.BLACK ? '#00f7ff' : '#ff00ff';
        this.boardCtx.shadowBlur = 15;
        
        this.boardCtx.beginPath();
        this.boardCtx.arc(posX, posY, this.cellSize * 0.35, 0, Math.PI * 2);
        this.boardCtx.fill();
        
        this.boardCtx.restore();
      }
    }
  }

  // 落子
  placeStone(row, col) {
    // 检查有效性
    if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) return false;
    if (this.board[row][col] !== this.EMPTY) return false;
    
    // 记录移动
    this.moveHistory.push({ row, col, player: this.currentPlayer });
    
    // 更新棋盘
    this.board[row][col] = this.currentPlayer;
    
    // 计算落子位置（用于特效）
    const posX = (col + 1) * this.cellSize;
    const posY = (row + 1) * this.cellSize;
    
    // 创建落子特效
    this.effects.createPlaceEffect(posX, posY, this.currentPlayer === this.BLACK);
    
    // 检查胜利
    const winResult = this.checkWin(row, col);
    if (winResult) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      
      // 显示胜利特效
      setTimeout(() => {
        this.showWinner();
      }, 500);
    }
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === this.BLACK ? this.WHITE : this.BLACK;
    
    // 更新UI
    this.updateUI();
    this.render();
    
    return true;
  }

  // 检查胜利
  checkWin(row, col) {
    const player = this.board[row][col];
    const directions = [
      [[0, 1], [0, -1]],   // 水平
      [[1, 0], [-1, 0]],   // 垂直
      [[1, 1], [-1, -1]], // 对角线
      [[1, -1], [-1, 1]]  // 反对角线
    ];
    
    for (const [dir1, dir2] of directions) {
      let count = 1;
      const winPositions = [{ row, col }];
      
      // 正方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dir1[0] * i;
        const newCol = col + dir1[1] * i;
        if (this.isValidPos(newRow, newCol) && this.board[newRow][newCol] === player) {
          count++;
          winPositions.push({ row: newRow, col: newCol });
        } else break;
      }
      
      // 反方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dir2[0] * i;
        const newCol = col + dir2[1] * i;
        if (this.isValidPos(newRow, newCol) && this.board[newRow][newCol] === player) {
          count++;
          winPositions.push({ row: newRow, col: newCol });
        } else break;
      }
      
      if (count >= 5) {
        return winPositions;
      }
    }
    
    return null;
  }

  // 检查位置有效性
  isValidPos(row, col) {
    return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
  }

  // 悔棋
  undo() {
    if (this.moveHistory.length === 0 || this.gameOver) return;
    
    const lastMove = this.moveHistory.pop();
    this.board[lastMove.row][lastMove.col] = this.EMPTY;
    
    // 特效
    const posX = (lastMove.col + 1) * this.cellSize;
    const posY = (lastMove.row + 1) * this.cellSize;
    this.effects.createUndoEffect(posX, this.effects.width * 0.5, this.effects.height * 0.5);
    
    // 切换回上一个玩家
    this.currentPlayer = lastMove.player;
    
    this.updateUI();
    this.render();
  }

  // 重置游戏
  reset() {
    this.initBoard();
    this.effects.clear();
    document.getElementById('winnerOverlay').classList.remove('show');
    this.render();
  }

  // 显示胜利界面
  showWinner() {
    const overlay = document.getElementById('winnerOverlay');
    const winnerStone = document.getElementById('winnerStone');
    const winnerTitle = document.getElementById('winnerTitle');
    
    // 设置胜利者棋子样式
    winnerStone.className = 'winner-stone ' + (this.winner === this.BLACK ? 'black' : 'white');
    
    // 设置标题
    winnerTitle.textContent = (this.winner === this.BLACK ? '黑方' : '白方') + '获胜!';
    
    // 创建胜利特效
    const winPositions = [];
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (this.board[row][col] === this.winner) {
          const x = (col + 1) * this.cellSize;
          const y = (row + 1) * this.cellSize;
          winPositions.push({ x, y });
        }
      }
    }
    
    this.effects.createWinEffect(winPositions.slice(-5), this.winner === this.BLACK);
    
    // 显示弹窗
    overlay.classList.add('show');
  }

  // 更新UI
  updateUI() {
    // 更新玩家状态
    const playerBlack = document.getElementById('playerBlack');
    const playerWhite = document.getElementById('playerWhite');
    
    playerBlack.classList.toggle('active', this.currentPlayer === this.BLACK);
    playerWhite.classList.toggle('active', this.currentPlayer === this.WHITE);
    
    // 更新游戏状态
    const statusText = document.querySelector('.status-text');
    if (this.gameOver) {
      statusText.textContent = '游戏结束';
    } else {
      statusText.textContent = (this.currentPlayer === this.BLACK ? '黑方' : '白方') + '回合';
    }
  }

  // 渲染棋盘
  render() {
    const ctx = this.boardCtx;
    const size = this.boardSize;
    const cellSize = this.cellSize;
    const padding = this.padding;
    
    // 清空画布
    ctx.clearRect(0, 0, size, size);
    
    // 绘制棋盘背景
    ctx.fillStyle = this.colors.boardBg;
    ctx.fillRect(0, 0, size, size);
    
    // 绘制网格发光效果
    ctx.save();
    ctx.strokeStyle = this.colors.gridLineGlow;
    ctx.lineWidth = cellSize * 0.15;
    
    for (let i = 0; i <= this.BOARD_SIZE + 1; i++) {
      const pos = i * cellSize;

      // 水平线：范围从 padding 到 size-padding
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(size - padding, pos);
      ctx.stroke();

      // 垂直线：范围从 padding 到 size-padding
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, size - padding);
      ctx.stroke();
    }
    ctx.restore();
    
    // 绘制网格线
    ctx.save();
    ctx.strokeStyle = this.colors.gridLine;
    ctx.lineWidth = 1;
    ctx.shadowColor = this.colors.gridLine;
    ctx.shadowBlur = 3;
    
    for (let i = 0; i <= this.BOARD_SIZE + 1; i++) {
      const pos = i * cellSize;

      // 水平线
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(size - padding, pos);
      ctx.stroke();

      // 垂直线
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, size - padding);
      ctx.stroke();
    }
    ctx.restore();
    
    // 绘制星位点
    const starPoints = [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
    
    ctx.fillStyle = this.colors.starPoint;
    starPoints.forEach(([row, col]) => {
      const x = (col + 1) * cellSize;
      const y = (row + 1) * cellSize;
      
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 绘制棋子
    this.board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== this.EMPTY) {
          const x = (colIndex + 1) * cellSize;
          const y = (rowIndex + 1) * cellSize;
          const radius = cellSize * 0.4;
          
          // 绘制棋子光晕
          ctx.save();
          const glowColor = cell === this.BLACK ? '#00f7ff' : '#ff00ff';
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 15;
          
          // 棋子渐变
          const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
          );
          
          if (cell === this.BLACK) {
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(0.5, '#1a1a1a');
            gradient.addColorStop(1, '#000');
          } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#f0f0f0');
            gradient.addColorStop(1, '#cccccc');
          }
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // 棋子高光
          const highlightGradient = ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x - radius * 0.2, y - radius * 0.2, radius * 0.5
          );
          highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = highlightGradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });
    });
    
    // 标记最后一手
    if (this.moveHistory.length > 0) {
      const lastMove = this.moveHistory[this.moveHistory.length - 1];
      const x = (lastMove.col + 1) * cellSize;
      const y = (lastMove.row + 1) * cellSize;
      const radius = cellSize * 0.5;
      
      ctx.save();
      ctx.strokeStyle = this.colors.lastMoveMarker;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.colors.lastMoveMarker;
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    }
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GomokuGame();
});
