precision mediump float;

uniform vec2 u_mouse;

varying lowp vec4 v_colour;
varying lowp vec2 v_pos;
varying lowp vec2 nnn;

void main() {

  float dist = distance(gl_FragCoord.xy, u_mouse * nnn.xy);
  
  float dx = u_mouse.x - v_pos.x;
  float dy = u_mouse.y - v_pos.y;
  
  float delta = abs(sqrt(dx*dx+dy*dy));
  
  float ux = dx / delta;
  float uy = dy / delta;  

  vec2 st = gl_FragCoord.xy / nnn.xy;
  vec2 mt = u_mouse.xy / nnn.xy;
  
  float pct = 0.0;
  
  pct = distance(st, u_mouse);
  vec3 dc = vec3(pct);
  
  
  vec3 colour = vec3(v_colour.rgb * dc.xyz * dist);
  
  vec3 cc = colour * vec3(mt.x, mt.y, 0.0);
  
  float y = (dist);
  
  gl_FragColor = vec4(cc.xyz, 1.0);
  //gl_FragColor = vec4(ux, uy, 0.0, 1.0);
  
}