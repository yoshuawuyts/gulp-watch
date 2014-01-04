'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var watch = require('./index');

gulp.task('mocha', function () {
    return gulp.src(['test/*.js'])
        .pipe(mocha({ reporter: 'list' }))
        .on('error', function (err) {
            console.log(err.stack);
        });
});

gulp.task('watch', function () {
    gulp.src(['test/**', 'index.js']).pipe(watch(function (events, cb) {
        gulp.run('mocha', cb);
    }));
});

gulp.task('default', function () {
    gulp.run('mocha');
    gulp.run('watch');
});
