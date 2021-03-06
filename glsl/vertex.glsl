precision mediump float;

attribute vec2 a_position;
attribute vec4 a_colour;

uniform vec2 u_resolution;

varying lowp vec4 v_colour;
varying lowp vec2 v_pos;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
   
   v_colour = a_colour;
   v_pos = a_position;
}