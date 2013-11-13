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
    }
    
  };
  
  var Game = {
    
    BOUNDARY: { x0: 0, x1: 320, y0:0, y1: 480 },
  
    MAX_PARTICLES: 500,
    
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
        render.drawRect(p.x, p.y, 12, 12);
      }
    },
    
    update: function () {
      this.updateParticles();
    },
    
    updateParticles: function () {
      var i, len = this.numParticles;
      for(i = 0; i < len; ++i) {
        this.particles[i].update();
      }
    },    
    
    tick: function () {
      this.update();
      this.draw();
      requestAnimFrame(proxy(this.tick, this));
    },
    
    reset: function () {
      this.createParticles();
    },
  
    randInRange: function(range) {
      return parseInt(Math.random()*range, 10);
    },
    
    createParticles: function () {
      var p, i, len = Game.MAX_PARTICLES;
      this.particles = [];
      for(i = 0; i < len; ++i) {
        p = Object.create(Particle);
        p.init(this.randInRange(320), this.randInRange(480));
        this.particles.push(p);
      }
      this.numParticles = this.particles.length;
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