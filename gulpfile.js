var gulp = require('gulp');
var browserify = require("browserify");
var babelify = require("babelify");
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');


// Lets bring es6 to es5 with this.
// Babel - converts ES6 code to ES5 - however it doesn't handle imports.
// Browserify - crawls your code for dependencies and packages them up
// into one file. can have plugins.
// Babelify - a babel plugin for browserify, to make browserify
// handle es6 including imports.

gulp.task('watch',function() {
    gulp.watch('src/css/**/*.scss', ['sass']);
    gulp.watch('src/js/**/*.js', ['build']);
    gulp.watch('src/bootstrap/**/*.js', ['build']);
    gulp.watch('src/config/**/*.js', ['build']);
});


gulp.task("build", function() {
    return browserify({
            entries: ['./src/js/app.js']
        })
        .transform(babelify.configure({
            presets: ['es2015']
        }))
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('./public/dist/js'))
});


gulp.task('pure', function() {
    return gulp.src('./node_modules/purecss/build/**/*-min.css')
        .pipe(minifyCss())
        .pipe(concat('pure.min.css'))
        .pipe(gulp.dest('./public/dist/css'));
});


gulp.task('sass', function() {
    return gulp.src('./src/css/app.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(gulp.dest('./public/dist/css'));
});

gulp.task('default', ['build', 'sass', 'pure', 'watch']);
