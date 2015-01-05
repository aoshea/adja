/*jshint browser:true */

(function (root, factory) {

  "use strict";

  root.Utils = factory(root);
                                            
})(this, function (window, undefined) {
  
  /* Helper method for preserving scope */
  var proxy = function () {
    var args = Array.prototype.slice.call(arguments),
        fn = args.shift(),
        context = args.shift();
      
    return function () {
      fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
    };
  };
  
  /* Polyfill for requestAnimationFrame */
  var requestAnimFrame = window.requestAnimationFrame || 
                         window.webkitRequestAnimationFrame || 
                         window.oRequestAnimationFrame || 
                         window.msRequestAnimationFrame || 
                         window.mozRequestAnimationFrame || 
                         function (callback) {
                           return window.setTimeout(callback, 1000/60);
                         };
                         
  return {
    proxy: proxy,
    requestAnimFrame: requestAnimFrame
  };
  
});/*jshint browser:true, devel:true */
/*global Float32Array */
(function (root) {
  
  "use strict"; 
  
  var document = root.document;
  
  root.render = (function () {
    
    var gl, 
        shaderProgram, 
        canvasWidth, 
        canvasHeight, 
        vertices, 
        lineVertices,
        colours, 
        vertexBuffer, 
        colourBuffer, 
        vertexPosAttrib, 
        vertexColourAttrib;
    
    function createShader(gl, shaderScript, src) {
      var shader;
      if (shaderScript.type === 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type === 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;
      }
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Error compiling shaders ' + gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }
    
    function getShader(gl, id) {
      var shaderScript, src, currentChild;      
      shaderScript = document.getElementById(id);
      if (!shaderScript) return null;
      
      src = '';
      currentChild = shaderScript.firstChild;
      while(currentChild) {
        if (currentChild.nodeType === currentChild.TEXT_NODE) {
          src += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
      }
      
      return createShader(gl, shaderScript, src);
    }
    
    function initShaders(gl, fragmentId, vertexId) {
      var fragmentShader = getShader(gl, fragmentId),
          vertexShader   = getShader(gl, vertexId);
          
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, fragmentShader);
      gl.attachShader(shaderProgram, vertexShader);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize shader program');
      }
      gl.useProgram(shaderProgram);    
    }
    
    function init(canvas) {
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
      
      gl = null;
  
      try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      } catch (e) {}
  
      if (!gl) {
        alert('Unable to initialise WebGL');
        return;
      }
        
      initShaders(gl, '2d-fragment-shader', '2d-vertex-shader');
      createBuffer();
    }

    function setRect(x, y, width, height) {
      var x1 = x + width, y1 = y + height;
      vertices.push(x, y, x1, y, x, y1, x, y1, x1, y, x1, y1);
      
      var scale = y / gl.canvas.height;

      colours.push(
              1.0, 0.0, 0.0, scale,
              0.0, 1.0, 0.0, scale,
              0.0, 1.0, 1.0, scale,
              0.0, 1.0, 1.0, scale,              
              0.0, 1.0, 0.0, scale,
              1.0, 0.0, 0.0, scale                      
      );
    }
    
    function drawRect(x, y, width, height) {
      if (!vertices) vertices = [];            
      setRect(x, y, width, height);
    }
    
    function drawLine(x0, y0, x1, y1) {
      lineVertices.push(x0, y0, x1, y1);
    }
    
    function clear() {
      vertices = [];
      lineVertices = [];
      colours = [];
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    function flush() {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
      gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
      
      gl.drawArrays(gl.TRIANGLES, 0, parseInt(vertices.length/2, 10));   
      
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
      gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);   
      
      gl.drawArrays(gl.LINES, 0, parseInt(lineVertices.length/2, 10));         
    }
    
    function createBuffer() {
      vertexColourAttrib = gl.getAttribLocation(shaderProgram, "a_colour");
      gl.enableVertexAttribArray(vertexColourAttrib);
      
      vertexPosAttrib = gl.getAttribLocation(shaderProgram, 'a_position');
      gl.enableVertexAttribArray(vertexPosAttrib);
  
      var resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
      gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
  
      // create buffer
      vertexBuffer = gl.createBuffer();
      colourBuffer = gl.createBuffer();
      
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
    }
    
    return {
      init: init,
      clear: clear,
      flush: flush,
      drawRect: drawRect,
      drawLine: drawLine
    };    
  })();
  
})(this);/*jshint devel:true */
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
      this.ax = 0;
      this.ay = 0;
    },
    
    update: function () {      
      this.ax *= Game.FRICTION;
      this.ay *= Game.FRICTION;
      this.ay += Game.GRAVITY;
    
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
    
    REST: 12,
    
    BOUNDARY: { x0: 0, x1: 480, y0:0, y1: 320 },
  
    MAX_PARTICLES: 910,
    
    CURTAIN_COLS: 70,
    
    CURTAIN_ROWS: 12,
    
    FRICTION: 0.99,
    
    GRAVITY: 0.9,
    
    init: function () {
      this.canvas = document.getElementById('canvas');
      this.originalWidth = this.canvas.width;
      this.originalHeight = this.canvas.height;
      render.init(this.canvas);  
      this.reset();
      document.onmousemove = proxy(this.handleMouseMove, this);
      document.onmousedown = proxy(this.handleMouseDown, this);
      document.onmouseup = proxy(this.handleMouseUp, this);
      root.addEventListener('resize', proxy(this.handleResize, this));
      requestAnimFrame(proxy(this.tick, this));
      this.handleResize();
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
      this.update();
      this.draw();
      requestAnimFrame(proxy(this.tick, this));
    },
    
    reset: function () {      
      this.createParticles();
      this.createCurtain(Game.CURTAIN_COLS, Game.CURTAIN_ROWS);
    },
  
    randInRange: function(range) {
      return parseInt(Math.random()*range, 10);
    },
    
    createParticles: function () {
      var p, i, len = Game.MAX_PARTICLES;
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
      this.canvas.width = document.documentElement.clientWidth;
      this.canvas.height = document.documentElement.clientHeight;
    }
  };
  
  var myGame = Object.create(Game);
  myGame.init();
  
})(this);