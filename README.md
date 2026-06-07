# Neon Gomoku - 科技炫酷五子棋

未来感设计的网页版五子棋游戏，支持双人对战。

## 功能特点

- 🎮 完整五子棋规则实现
- ✨ 科技炫酷视觉效果
- 💫 粒子爆发、霓虹光圈、能量波动特效
- 📱 响应式设计，支持桌面端与移动端
- 🔄 支持重置游戏和悔棋功能

## 运行方式

### 前置要求

需要安装 [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)

### 安装与启动

```bash
# 进入项目目录
cd neon-gomoku

# 安装依赖
npm install

# 启动服务器
npm start
```

然后在浏览器中打开 http://localhost:3000

## 操作说明

- 点击棋盘落子
- 轮流执黑/白子
- 五子连珠获胜
- 点击"重新开始"重置游戏
- 点击"悔棋"撤销上一步

## 项目结构

```
neon-gomoku/
├── server.js          # Node.js 服务器
├── package.json       # 项目配置
├── public/
│   ├── index.html     # 游戏页面
│   ├── css/
│   │   └── style.css  # 科技风格样式
│   └── js/
│       ├── game.js    # 游戏核心逻辑
│       └── effects.js # 粒子特效引擎
```

## 技术栈

- Node.js + Express
- HTML5 Canvas
- 纯 JavaScript (无框架)
- CSS3 动画与特效

---

Enjoy the game! 🎉
