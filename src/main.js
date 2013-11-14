/*jshint devel:true */
(function (root) {
  
  "use strict";

  var document         = root.document,
      render           = root.render,
      proxy            = root.Utils.proxy,
      requestAnimFrame = root.Utils.requestAnimFrame;
      
  var Particle = {        
    
    init: function (x, y) {
      this.x = x;
      this.y = y;
      this.ax = 4;
      this.ay = 2;
    },
    
    update: function () {      
      this.ax *= Game.FRICTION;
      this.ay *= Game.FRICTION;
    
      this.x += this.ax;
      this.y += this.ay;
 
      if (this.x < Game.BOUNDARY.x0) this.x += Game.BOUNDARY.x1;
      if (this.y < Game.BOUNDARY.y0) this.y += Game.BOUNDARY.y1;
      if (this.x > Game.BOUNDARY.x1) this.x = Game.BOUNDARY.x0;
      if (this.y > Game.BOUNDARY.y1) this.y = Game.BOUNDARY.y0;
    },
    
    clone: function () {
      var p = Object.create(this);
      p.init(this.x, this.y);
      return p;
    }
    
  };
  
  var Constraint = {
    
    init: function (p) {
      this.p = p;
      this.p0 = p.clone();
      this.maxLen = 40;
    },
 
    update: function () {
      var dx, dy, len, dist;
    
      dx = this.p.x - this.p0.x;
      dy = this.p.y - this.p0.y;
      len = Math.sqrt(dx*dx + dy*dy);
    
      if (len === 0) len = 0.001;
    
      dist = 1 * (this.maxLen - len) * 0.5 * -1;
    
      var ddx, ddy;
    
      ddx = this.p0.x + dx * 0.5;
      ddy = this.p0.y + dy * 0.5;
    
      dx /= len;
      dy /= len;
    
      this.p0.x = ddx + dx * 0.5 * this.maxLen * -1;
      this.p0.y = ddy + dy * 0.5 * this.maxLen * -1;
    
      this.p.x = ddx + dx * 0.5 * this.maxLen;
      this.p.y = ddy + dy * 0.5 * this.maxLen;
    
      this.p0.ax = this.p0.ax + dx * dist;
      this.p0.ay = this.p0.ay + dy * dist;
    
      this.p.ax = this.p.ax + dx * -dist;
      this.p.ay = this.p.ay + dy * -dist;
            
    }
  };
  
  var Game = {
    
    BOUNDARY: { x0: 0, x1: 1366, y0:0, y1: 320 },
  
    MAX_PARTICLES: 2000,
    
    FRICTION: 0.99,
    
    init: function () {
      render.init(document.getElementById('canvas'));  
      this.reset();
      document.onmousemove = proxy(this.handleMouseMove, this);
      requestAnimFrame(proxy(this.tick, this));
    },
    
    draw: function () {
      render.clear();
      this.drawParticles();
      render.flush();
    },
    
    drawParticles: function () {
      var p, i, len = this.numParticles;
      for(i = 0; i < len; ++i) {
        p = this.particles[i];
        render.drawRect(p.x, p.y, 50, 50);
      }
    },
    
    update: function () {
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
      var i, len = this.numContraints;
      for(i = 0; i < len; ++i) {
        this.constraints[i].update();
      }
    },
    
    tick: function () {
      this.update();
      this.draw();
      requestAnimFrame(proxy(this.tick, this));
    },
    
    reset: function () {      
      this.createParticles();
      this.createConstraints();
    },
  
    randInRange: function(range) {
      return parseInt(Math.random()*range, 10);
    },
    
    createParticles: function () {
      var p, i, len = Game.MAX_PARTICLES;
      this.particles = [];
      for(i = 0; i < len; ++i) {
        p = Object.create(Particle);
        p.init(this.randInRange(1366), this.randInRange(480));
        this.particles.push(p);
      }
      this.numParticles = this.particles.length;
    },
    
    createConstraints: function () {
      this.constraints = [];
      var p, c, i, len = this.numParticles; 
      for(i = 0; i < len; ++i) {
        p = this.particles[i];
        c = Object.create(Constraint);
        c.init(p);
        this.constraints.push(c);
        if (i) {
          c = Object.create(Constraint);
          c.init(this.particles[i-1]);
          this.constraints.push(c);
        }
      }
      this.numContraints = this.constraints.length;
    },
    
    handleMouseMove: function (e) {
      var dx, dy, deltaLen, p, i, len = this.particles.length;
      for(i = 0; i < len; ++i) {
        p = this.particles[i];
        dx = p.x - e.pageX;
        dy = p.y - e.pageY;
        deltaLen = Math.sqrt(dx * dx + dy * dy);
        dx /= deltaLen;
        dy /= deltaLen;
        p.ax += dx * 0.05;
        p.ay += dy * 0.05;        
      }      
    }
  };
  
  var myGame = Object.create(Game);
  myGame.init();
  
})(this);