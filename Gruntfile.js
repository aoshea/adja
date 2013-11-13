module.exports = function (grunt) {
  grunt.initConfig({
    // grunt tasks go here
    
    // jshint options
    jshint: {
      // files to lint 
      all: ['src/*.js']
    },
    
    // concat options 
    concat: {
      options: {  
        separator: ';' // separates scripts
      },
      dist: {
        src: ['src/utils.js', 'src/render.js', 'src/main.js'],
        dest: 'js/script.js' // where to output script
      }
    },
    
    // uglify options 
    uglify: {
      js: {
        files: {
          'js/script.js': ['js/script.js'] // overwrite the concat script 
        }
      }
    }
    
  });
  
  // load our tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
}
