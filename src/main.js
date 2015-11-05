
"use strict";

// require module dependencies
var render    = require('./render.js'),
    utils     = require('./utils.js');
    
var proxy = utils.proxy;
var raf   = utils.requestAnimFrame;
  
var Constants = {  
  FRICTION: 0.975,  
  GRAVITY: 1.1,
  MAX_PARTICLES: 2000,  
  CURTAIN_COLS: 80,  
  CURTAIN_ROWS: 18  
};

var Particle = {        
  
  init: function (x, y) {
    this.x = x;
    this.y = y;
    this.ax = 0;
    this.ay = 0;
  },
  
  update: function () {      
    this.ax *= Constants.FRICTION;
    this.ay *= Constants.FRICTION;
    this.ay += Constants.GRAVITY;
  
    this.x += this.ax;
    this.y += this.ay;
  },
  
  clone: function () {
    var p = Object.create(this);
    p.init(this.x, this.y);
    return p;
  }
  
};

var Constraint = {
  
  init: function (rest, a, b) {
    this.pA = a;
    this.rest = rest;
    if (!b) {
      this.pB = a.clone();
      this.pin = true;
      return;
    }
    this.pB = b;
  },
  
  getLine: function () {
    return {
      x0: this.pA.x, 
      y0: this.pA.y,
      x1: this.pB.x,
      y1: this.pB.y
    };
  },

  update: function () {
    var dx, dy, len, dist, ddx, ddy;
  
    dx = this.pA.x - this.pB.x;
    dy = this.pA.y - this.pB.y;
    
    len = Math.sqrt(dx*dx + dy*dy);
  
    if (len === 0) len = 0.001;
  
    dist = 1 * (this.rest - len) * 0.5 * -1;

    ddx = this.pB.x + dx * 0.5;
    ddy = this.pB.y + dy * 0.5;
  
    dx /= len;
    dy /= len;
  
    if (!this.pin) {
      this.pB.x = ddx + dx * 0.5 * this.rest * -1;
      this.pB.y = ddy + dy * 0.5 * this.rest * -1;
  
      this.pB.ax = this.pB.ax + dx * dist;
      this.pB.ay = this.pB.ay + dy * dist;    
    }
    
    this.pA.x = ddx + dx * 0.5 * this.rest;
    this.pA.y = ddy + dy * 0.5 * this.rest;

    this.pA.ax = this.pA.ax + dx * -dist;
    this.pA.ay = this.pA.ay + dy * -dist;
  }
  
};

var Game = {
  
  REST: 24,
  
  BOUNDARY: { x0: 0, x1: 480, y0:0, y1: 320 },
  
  init: function () {
    this.canvas = document.getElementById('canvas');
        
    this.originalWidth = this.canvas.clientWidth;
    this.originalHeight = this.canvas.clientHeight;
    
    render.init(this.canvas);  
    this.handleResize();
    
    this.reset();
    document.onmousemove = proxy(this.handleMouseMove, this);
    document.onmousedown = proxy(this.handleMouseDown, this);
    document.onmouseup = proxy(this.handleMouseUp, this);
    window.addEventListener('resize', proxy(this.handleResize, this));
    raf(proxy(this.tick, this));
  },
  
  draw: function () {
    render.clear();
    this.drawParticles();
    this.drawConstraints();
    render.flush();
  },
  
  drawParticles: function () {
    var p, i, len = this.numParticles;
    for(i = 0; i < len; ++i) {
      p = this.particles[i];
      var size = 4;
      render.drawRect(p.x-size/2, p.y-size/2, size, size);
    }
  },
  
  drawConstraints: function () {
    var i, line, len = this.constraints.length;
    for(i = 0; i < len; ++i) {
      line = this.constraints[i].getLine();
      render.drawLine(line.x0, line.y0, line.x1, line.y1);
    }
  },
  
  updateMouse: function () {
    if (this.mouseDown) {
      this.applyForceFrom(this.mouseX, this.mouseY, -1);
    }
  },
  
  update: function () {
    this.updateMouse();
    this.updateParticles();
    this.updateConstraints();
    
  },
  
  updateParticles: function () {
    var i, len = this.numParticles;
    for(i = 0; i < len; ++i) {
      this.particles[i].update();
    }
  }, 
  
  updateConstraints: function () {
    var i, len = this.constraints.length;
    for(i = 0; i < len; ++i) {
      this.constraints[i].update();
    }
  },
  
  tick: function () {
    raf(proxy(this.tick, this));

    if (!render.ready()) {
      return;
    }  
    
    this.update();
    this.draw();
    
  },
  
  reset: function () {      
    this.createParticles();
    this.createCurtain(Constants.CURTAIN_COLS, Constants.CURTAIN_ROWS);
  },

  randInRange: function(range) {
    return parseInt(Math.random()*range, 10);
  },
  
  createParticles: function () {
    var p, i, len = Constants.MAX_PARTICLES;
    this.particles = [];
    for(i = 0; i < len; ++i) {
      p = Object.create(Particle);
      p.init(0, 0);
      this.particles.push(p);
    }
    this.numParticles = this.particles.length;
  },
  
  createConstraint: function (pA, pB, constraints) {      
    var constraint = Object.create(Constraint);
    constraint.init(Game.REST, pA, pB);
    constraints.push(constraint);
  },
  
  pinConstraint: function (pA, constraints) {
    var constraint = Object.create(Constraint);
    constraint.init(1, pA);
    constraints.push(constraint);
  },
  
  createCurtain: function (cols, rows) {        
    var x, y, i = 0;
    this.constraints = [];    
    for(x = 0; x < cols; ++x) {
      for(y = 0; y < rows; ++y) {
        if (i >= this.numParticles-1) return;
        this.createConstraint(this.particles[i++], this.particles[i], this.constraints);
        this.particles[i-1].x = (Game.BOUNDARY.x1 / 2) + (x * Game.REST);
        this.particles[i-1].y = y * Game.REST;            
        if (y === 0) {
          this.pinConstraint(this.particles[i-1], this.constraints);          
        }
        if (x > 0) {
          this.createConstraint(this.particles[i], this.particles[i-rows-1], this.constraints);
        }
      }
      ++i;
    }
  }, 
  
  applyForceFrom: function (x, y, mag) {
    var dx, dy, deltaLen, p, i, len = this.numParticles;
    for(i = 0; i < len; ++i) {
      p = this.particles[i];
      dx = p.x - x;
      dy = p.y - y;
      deltaLen = Math.sqrt(dx * dx + dy * dy);
      dx /= deltaLen;
      dy /= deltaLen;
      p.ax += dx * mag;
      p.ay += dy * mag;      
    }     
  },
  
  getNearestParticle: function (x, y) {
    var dx, dy, i, len, delta = 1000, p;
    for(i = 0; i < this.numParticles; ++i) {
      dx = this.particles[i].x - x;
      dy = this.particles[i].y - y;
      len = Math.sqrt(dx * dx + dy * dy);
      if (len < delta) {
        p = this.particles[i];
        delta = len;
      }
    }
    return p;
  },
  
  setMousePosition: function (x, y) {
    var scaleX = this.canvas.width / this.originalWidth,
        scaleY = this.canvas.height / this.originalHeight;
        
    this.mouseX = x / scaleX;
    this.mouseY = y / scaleY;
    
    render.setMouse(this.mouseX, this.mouseY);
  },
  
  handleMouseDown: function (e) {
    this.mouseDown = true;  
    this.setMousePosition(e.pageX, e.pageY); 
  },
  
  handleMouseUp: function () {
    this.mouseDown = false;
  },
  
  handleMouseMove: function (e) {
    this.setMousePosition(e.pageX, e.pageY); 
  },
  
  handleResize: function () {      
        
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    render.resize(this.canvas.width, this.canvas.height);
  }
};

module.exports = Game;