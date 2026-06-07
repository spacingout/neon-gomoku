/**
 * Neon Gomoku - 粒子与光效特效
 */

class EffectsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.rings = [];
    this.pulseEffects = [];
    this.lastTime = 0;
    this.animationId = null;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // 重置变换避免累积
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  // 创建落子粒子爆发效果
  createPlaceEffect(x, y, isBlack) {
    const color = isBlack ? '#00f7ff' : '#ff00ff';
    const secondaryColor = isBlack ? '#3b82f6' : '#ec4899';
    
    // 粒子爆发
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const size = 2 + Math.random() * 3;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: Math.random() > 0.5 ? color : secondaryColor,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        type: 'spark'
      });
    }

    // 能量环
    this.rings.push({
      x,
      y,
      radius: 5,
      maxRadius: 40,
      color,
      opacity: 1,
      lineWidth: 3,
      type: 'expand'
    });

    // 中心脉冲
    this.pulseEffects.push({
      x,
      y,
      radius: 5,
      maxRadius: 25,
      color,
      opacity: 1,
      type: 'pulse'
    });

    // 外圈涟漪
    this.rings.push({
      x,
      y,
      radius: 10,
      maxRadius: 60,
      color: secondaryColor,
      opacity: 0.6,
      lineWidth: 1,
      type: 'ripple'
    });
  }

  // 创建胜利连线效果
  createWinEffect(positions, isBlack) {
    const color = isBlack ? '#00f7ff' : '#ff00ff';
    
    // 为每条连线创建发光效果
    positions.forEach((pos, index) => {
      setTimeout(() => {
        this.createPlaceEffect(pos.x, pos.y, isBlack);
      }, index * 100);
    });
  }

  // 创建悔棋撤销效果
  createUndoEffect(x, y) {
    const color = '#8b5cf6';
    
    // 反向粒子
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      
      this.particles.push({
        x,
        y,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        color,
        life: 1,
        decay: 0.03,
        type: 'spark'
      });
    }
  }

  // 更新和绘制
  update(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 更新和绘制粒子
    this.updateParticles();
    
    // 更新和绘制光环
    this.updateRings();
    
    // 更新和绘制脉冲
    this.updatePulses();
    
    // 继续动画循环
    this.animationId = requestAnimationFrame((t) => this.update(t));
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // 更新位置
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      
      // 绘制
      if (p.life > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        
        if (p.type === 'spark') {
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.restore();
      } else {
        this.particles.splice(i, 1);
      }
    }
  }

  updateRings() {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      
      // 更新半径
      r.radius += (r.maxRadius - r.radius) * 0.1;
      r.opacity = 1 - (r.radius / r.maxRadius);
      
      // 绘制
      if (r.opacity > 0) {
        this.ctx.save();
        this.ctx.strokeStyle = r.color;
        this.ctx.globalAlpha = r.opacity;
        this.ctx.lineWidth = r.lineWidth;
        this.ctx.shadowColor = r.color;
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
      } else {
        this.rings.splice(i, 1);
      }
    }
  }

  updatePulses() {
    for (let i = this.pulseEffects.length - 1; i >= 0; i--) {
      const p = this.pulseEffects[i];
      
      // 更新
      p.radius += (p.maxRadius - p.radius) * 0.08;
      p.opacity = 1 - (p.radius / p.maxRadius);
      
      // 绘制
      if (p.opacity > 0) {
        this.ctx.save();
        
        // 外圈
        this.ctx.strokeStyle = p.color;
        this.ctx.globalAlpha = p.opacity * 0.5;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 内圈
        this.ctx.strokeStyle = '#fff';
        this.ctx.globalAlpha = p.opacity * 0.8;
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 中心点
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
      } else {
        this.pulseEffects.splice(i, 1);
      }
    }
  }

  // 启动动画循环
  start() {
    if (!this.animationId) {
      this.animationId = requestAnimationFrame((t) => this.update(t));
    }
  }

  // 停止动画循环
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // 清空所有效果
  clear() {
    this.particles = [];
    this.rings = [];
    this.pulseEffects = [];
  }
}

// 导出
window.EffectsEngine = EffectsEngine;
