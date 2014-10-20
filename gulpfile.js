var gulp   = require('gulp'),
concat     = require('gulp-concat'),
replace    = require('gulp-replace'),
plumber    = require('gulp-plumber'),
stripDebug = require('gulp-strip-debug'),
uglify     = require('gulp-uglify'),
order      = require('gulp-order'),
watch      = require('gulp-watch'),
sass       = require('gulp-sass'),
gzip       = require('gulp-gzip'),
minifyCSS  = require('gulp-minify-css');

var onError = function (err) {
  console.log(err);
}

var env = "debug";
var backendHostname;

if (env === "debug") {
  backendHostname = "http://localhost:5000";
} else {
  backendHostname = "http://thing.skyred.fi";
}


/*
gulp.task('bootstrap', function () {
  gulp.src([
    'src/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'src/bower_components/font-awesome/css/font-awesome.min.css',
    ])
    .pipe(concat('deps.css'))
    .pipe(gulp.dest('./static/'));
});
*/

gulp.task('dist', function () {
  gulp.src([
      'assets/stylesheets/styles.css',
    ])
    .pipe(minifyCSS())
    .pipe(concat('app.css'))
    .pipe(gulp.dest('./static/'))
});

/*
gulp.task('sass', function () {
  gulp.src([
      'src/stylesheets/main.scss',
    ])
    .pipe(sass({
        errLogToConsole: true,
        sourceComments : 'normal'
    }))
    .pipe(concat('user.css'))
    .pipe(gulp.dest('./static/'));
});
*/


gulp.task('compile', function() {
  gulp.src([
      'assets/bower_components/angular/angular.js',
      'assets/bower_components/angular-resource/angular-resource.js',
      'assets/bower_components/angular-route/angular-route.js',
      'assets/bower_components/angular-cookies/angular-cookies.js',
      'assets/javascripts/app/gitthing.controllers.js',
      'assets/javascripts/app/gitthing.services.js',
      'assets/javascripts/app/gitthing.js',
    ])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(replace('__BACKEND__', backendHostname))
    .pipe(concat('app.js'))
    .pipe(stripDebug())
    .pipe(uglify())
    //.pipe(gzip())
    .pipe(gulp.dest('./static/'));
});

gulp.task('watch', function() {

  gulp.watch(['./assets/javascripts/app/*.js', 'assets/stylesheets/*.css'], ['compile', 'dist']);

});



gulp.task('default', ['compile', 'dist']);