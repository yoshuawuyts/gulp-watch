/* global describe, it */
'use strict';

delete require.cache[require.resolve('..')];
var watch = require('..'),
    assert = require('assert'),
    Stream = require('stream').Stream,
    path = require('path'),
    async = require('async'),
    gulp = require('gulp'),
    fs = require('fs');

var sourceDir = path.join(__dirname, 'fixtures'),
    sourceFiles = path.join(sourceDir, '*'),
    files = ['test.js', 'test.coffee'];

function touchFiles() {
    files.forEach(function (file) {
        fs.writeFileSync(path.join(sourceDir, file), file);
    });
}

describe('gulp-watch', function () {
    it('should throw, if we provide invalid callback', function () {
        assert.throws(watch.bind(null, 'string'), /Provided callback is not a function/);
    });

    it('should return stream', function () {
        assert.ok(watch() instanceof Stream, 'Stream was not returned');
        assert.ok(watch(function () { }) instanceof Stream, 'Stream was not returned');
    });

    it('should capture events with batched version', function (done) {
        var pipe = gulp.src(sourceFiles).pipe(watch(function (events) {
            assert.equal(events.length, 2);
            pipe.emit('unwatch');
            done();
        }));

        setTimeout(touchFiles, 100);
    });

    it('should capture events with stream version', function (done) {
        var iterator = async.iterator([
            function (file) {
                assert.ok(files.indexOf(path.basename(file.path)) !== -1);
            },
            function (file) {
                assert.ok(files.indexOf(path.basename(file.path)) !== -1);
                pipe.emit('unwatch');
                done();
            }
        ]);

        var pipe = gulp.src(sourceFiles).pipe(watch())
            .on('data', function (file) {
                iterator = iterator(file);
            });

        setTimeout(touchFiles, 100);
    });
});
