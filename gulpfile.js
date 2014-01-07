'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var watch = require('./index');

gulp.task('watch', function (cb) {
    gulp.src(['test/*.js', 'index.js'], { read: false })
        .pipe(watch(function (events, cb) {
            gulp.src(['test/*.js'])
                .pipe(mocha({ reporter: 'spec' }))
                .on('error', cb.bind(null, null))
                .on('end', cb);
        }))
        .on('end', cb);
});

gulp.task('default', function (cb) {
    gulp.run('watch', cb);
});
