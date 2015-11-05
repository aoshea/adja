(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = require('./main.js');

var g = Object.create(game);
g.init();

console.log('init!!');
},{"./main.js":2}],2:[function(require,module,exports){

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
  
  REST: 12,
  
  BOUNDARY: { x0: 0, x1: 480, y0:0, y1: 320 },
  
  init: function () {
    this.canvas = document.getElementById('canvas');
    this.originalWidth = this.canvas.width;
    this.originalHeight = this.canvas.height;
    render.init(this.canvas);  
    this.reset();
    document.onmousemove = proxy(this.handleMouseMove, this);
    document.onmousedown = proxy(this.handleMouseDown, this);
    document.onmouseup = proxy(this.handleMouseUp, this);
    window.addEventListener('resize', proxy(this.handleResize, this));
    raf(proxy(this.tick, this));
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
    this.canvas.width = document.documentElement.clientWidth;
    this.canvas.height = document.documentElement.clientHeight;
  }
};

module.exports = Game;
},{"./render.js":3,"./utils.js":4}],3:[function(require,module,exports){
'use strict';
    
// Shaders 
var shaderSource = {
  vertex: '',
  fragment: '',
};

var stats = {
  isReady: false
};

var u_mouse = {
  x:0,
  y:0
};

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

function createBuffer() {
  vertexColourAttrib = gl.getAttribLocation(shaderProgram, "a_colour");
  gl.enableVertexAttribArray(vertexColourAttrib);

  vertexPosAttrib = gl.getAttribLocation(shaderProgram, 'a_position');
  gl.enableVertexAttribArray(vertexPosAttrib);

  var resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
  gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
  
  //var mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
  //gl.uniform2f(mouseLocation, u_mouse.x, u_mouse.y);

  // create buffer
  vertexBuffer = gl.createBuffer();
  colourBuffer = gl.createBuffer();

  //gl.enable(gl.BLEND);
  //gl.disable(gl.DEPTH_TEST);
}


// Load glsl code into shaders object 
function loadShaders( shaders, callback ) {

  var queue = 0;
  
  function loadHandler( name, req ) {
    console.log('loaded', name);
    
    return function () {      
      shaders[name] = req.responseText;
      if ( --queue <= 0 ) callback();
    }
  }

  for(var name in shaders) {
  
    queue++;
    
    console.log('add to queue');
  
    var req = new XMLHttpRequest();
    req.onload = loadHandler( name, req );
    req.open( 'get', 'glsl/' + name + '.glsl', true);
    req.send();
  
  }
}

// Create and compile shader from source 
function createShader( source, type ) {

  var shader = gl.createShader( type );

  gl.shaderSource( shader, source );
  gl.compileShader( shader );

  if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS) ) {
    throw gl.getShaderInfoLog( shader );
  }

  return shader;
}

// Create shader program and create & link shaders 
function createProgram( vertexSrc, fragmentSrc ) {

  var vertexShader, fragmentShader, program;

  vertexShader = createShader( vertexSrc, gl.VERTEX_SHADER ),
  fragmentShader = createShader( fragmentSrc, gl.FRAGMENT_SHADER );

  program = gl.createProgram();
 
  gl.attachShader( program, fragmentShader );
  gl.attachShader( program, vertexShader );
  gl.linkProgram( program );

  if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
    throw gl.getProgramInfoLog( program );
  }
    
  return program;  
}

function setupShaders() {
  console.log('seupthshader', shaderSource);
  
  shaderProgram = createProgram(shaderSource.vertex, shaderSource.fragment);
  gl.useProgram(shaderProgram);
  
  createBuffer();
  
  stats.isReady = true;
}

function init(canvas) {
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  
  gl = null;

  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {}

  if (!gl) {
    console.warn('Unable to initialise WebGL');
    return;
  }
  
  loadShaders(shaderSource, setupShaders);
    
  //initShaders(gl, '2d-fragment-shader', '2d-vertex-shader');
  //createBuffer();
}

function setMouse(x,y){
  u_mouse.x = x;
  u_mouse.y = y;  
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
  
  //var mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
  //gl.uniform2f(mouseLocation, u_mouse.x, u_mouse.y);
  
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
  gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
  
  gl.drawArrays(gl.TRIANGLES, 0, parseInt(vertices.length/2, 10)); 
  
  gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
  gl.vertexAttribPointer(vertexColourAttrib, 4, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW); 
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    
  gl.drawArrays(gl.LINES, 0, lineVertices.length / 2)
}


    
module.exports = {
  ready: function () {
    return stats.isReady;
  },
  init: init,
  clear: clear,
  flush: flush,
  drawRect: drawRect,
  drawLine: drawLine,
  setMouse: setMouse
}; 
},{}],4:[function(require,module,exports){
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
                       
module.exports = {
  proxy: proxy,
  requestAnimFrame: requestAnimFrame
};
},{}]},{},[1])


//# sourceMappingURL=script.js.map
