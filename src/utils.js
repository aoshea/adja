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
  
});