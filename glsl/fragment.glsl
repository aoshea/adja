precision mediump float;

uniform vec2 u_mouse;

varying lowp vec4 v_colour;
varying lowp vec2 v_pos;
varying lowp vec2 nnn;

void main() {
  vec2 st = gl_FragCoord.xy / nnn.xy;
  vec3 colour = v_colour.rgb;
  
  vec3 cc = colour * vec3(st.x, st.y, 0.0);
  
  gl_FragColor = vec4(v_pos.x/nnn.x, u_mouse.y, 0.4, 1.0);
  
}