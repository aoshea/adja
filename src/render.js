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

var timer = 0.0;

var gl, 
    shaderProgram,
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
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  
  var mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
  gl.uniform2f(mouseLocation, u_mouse.x, u_mouse.y);
  
  var timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');
  gl.uniform1f(timeLocation, timer);

  // create buffer
  vertexBuffer = gl.createBuffer();
  colourBuffer = gl.createBuffer();

  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
}


// Load glsl code into shaders object 
function loadShaders( shaders, callback ) {

  var queue = 0;
  
  function loadHandler( name, req ) {    
    return function () {      
      shaders[name] = req.responseText;
      if ( --queue <= 0 ) callback();
    };
  }

  for(var name in shaders) {
  
    queue++;
    
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

  vertexShader = createShader( vertexSrc, gl.VERTEX_SHADER );
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
  shaderProgram = createProgram(shaderSource.vertex, shaderSource.fragment);
  gl.useProgram(shaderProgram);
  
  createBuffer();
  
  stats.isReady = true;
}

function init(canvas) {
  gl = null;

  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {}

  if (!gl) {
    console.warn('Unable to initialise WebGL');
    return;
  }
  
  loadShaders(shaderSource, setupShaders);
}

function setMouse(x,y){
  u_mouse.x = x / gl.canvas.width;
  u_mouse.y = y / gl.canvas.height;
  u_mouse.y = -u_mouse.y;
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

function resize(width, height) {  
  gl.canvas.width = width;
  gl.canvas.height = height;
}

function flush() {
  
  gl.viewport(0, 0, gl.canvas.width,  gl.canvas.height);
    
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  
  var mouseLocation = gl.getUniformLocation(shaderProgram, 'u_mouse');
  gl.uniform2f(mouseLocation, u_mouse.x, u_mouse.y);
  
  timer += 0.01;
  var timeLocation = gl.getUniformLocation(shaderProgram, 'u_time');
  gl.uniform1f(timeLocation, timer);

  var resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

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
    
  gl.drawArrays(gl.LINES, 0, lineVertices.length / 2);
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
  setMouse: setMouse,
  resize: resize
}; 