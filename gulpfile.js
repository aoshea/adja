'use strict';

var gulp        = require('gulp'),
    livereload  = require('gulp-livereload'),
    jshint      = require('gulp-jshint'),
    gulpif      = require('gulp-if'),
    gutil       = require('gulp-util'),
    notify      = require('gulp-notify'),
    sourcemaps  = require('gulp-sourcemaps'),
    uglify      = require('gulp-uglify'),

    browserify  = require('browserify'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    del         = require('del'),
    argv        = require('yargs').argv;

/**
 * Production flag 
 * @usage `gulp --production`
 */
var production = !!argv.production;

/** 
  * Setup source globs 
  */
var dir = {
  source: 'src/',
  build:  'dist/'
};

var sources = {
  app:     [ dir.source + 'index.js' ],
  js:      [ dir.source + '**/*.js'],
};

/**
 * Error handling  
 */
var onError = function (task) {
  return function (err) {

    notify.onError({
      message: task + ' failed'
    })(err);

    gutil.log( gutil.colors.bgRed(task + ' error:'), gutil.colors.red(err) );
  };
};

/**
 * Lint javascript 
 */
gulp.task('lint', function () {
  return gulp.src(sources.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .on('error', onError('lint'));
});

/**
 * Process javascript 
 * Lint with `jshint-stylish` reporter
 * Browserify puts the right files in order
 * @usage `gulp js`
 */
gulp.task('js', ['lint'], function () {
  
  var b = browserify({
    entries: sources.app,
    debug: !production
  });

  return b.bundle()
    .on('error', onError('js'))
    .pipe(source('script.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps:true}))
    .pipe(gulpif(production, uglify()))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dir.build));
});

/**
 * Watch for the changes 
 * @usage `gulp watch`
 */
gulp.task('watch', function () {

  livereload.listen();  
  gulp.watch(sources.allcss, ['css']);
  gulp.watch(sources.js, ['js']);
  gulp.watch('glsl/*', ['js']);
  gulp.watch('**/*').on('change', livereload.changed);
});

/**
 * Default gulp 
 * @usage `gulp`
 */
gulp.task('default', ['js', 'watch']);