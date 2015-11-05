precision mediump float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;

varying lowp vec4 v_colour;
varying lowp vec2 v_pos;

void main() {

  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  
  float pct = abs(sin(u_time));
  
  vec3 colourA = vec3(st.x, st.y, 0.0);
  vec3 colourB = vec3(0.0, st.x, st.y);
  
  gl_FragColor = vec4(mix(colourA, colourB, pct), 1.0);
}