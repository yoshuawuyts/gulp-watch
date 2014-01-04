/* global describe, it, afterEach */
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
    sourceFiles = path.join(sourceDir, '**'),
    files = ['test.js', 'test.coffee', 'subfolder/subfile.js'],
    dirs = ['', 'subfolder'];

var touchTimeout = 1000;

function touchFile(file) {
    file = file || files[0];
    fs.writeFileSync(path.join(sourceDir, file), file);
}

function touchFiles() {
    files.map(touchFile);
}

describe('gulp-watch', function () {

    afterEach(function (done) {
        if (this.pipe !== undefined) {
            this.pipe.on('end', done);
            this.pipe.emit('unwatch');
            this.pipe = undefined;
        } else {
            done();
        }
    });

    it('should throw, if we provide invalid callback', function () {
        assert.throws(watch.bind(null, 'string'), /Provided callback is not a function/);
    });

    it('should return stream', function () {
        assert.ok(watch() instanceof Stream, 'Stream was not returned');
        assert.ok(watch(function () { }) instanceof Stream, 'Stream was not returned');
    });

    it('should capture events with batched version', function (done) {
        this.pipe = gulp.src(sourceFiles).pipe(watch(function (events) {
            assert.equal(events.length, 3);
            done();
        }));

        setTimeout(touchFiles, touchTimeout);
    });

    it('should capture events with stream version', function (done) {
        function check(file) {
            assert.ok(files.concat(dirs).indexOf(file.relative) !== -1);
        }

        var iterator = async.iterator([
            check, check, check, check,
            function (file) {
                check(file);
                done();
            }
        ]);

        this.pipe = gulp.src(sourceFiles).pipe(watch())
            .on('data', function (file) {
                iterator = iterator(file);
            });

        setTimeout(touchFiles, touchTimeout);
    });

    it('should preserve contents and stat', function (done) {
        var expected;
        this.pipe = gulp.src(path.join(sourceDir, files[0]))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch(function (events) {
                var actual = events.pop();
                assert.ok(actual.contents);
                assert.deepEqual(actual.contents, expected.contents);
                assert.ok(actual.stat);
                done();
            }));

        setTimeout(touchFile, touchTimeout);
    });

    it('should support `read: false` option', function (done) {
        var expected;
        this.pipe = gulp.src(path.join(sourceDir, files[0]))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch({ read: false }, function (events) {
                var actual = events.pop();
                assert.ok(!actual.contents);
                assert.ok(actual.stat);
                done();
            }));

        setTimeout(touchFile, touchTimeout);
    });

    it('should support `buffer: false` option', function (done) {
        var expected;
        this.pipe = gulp.src(path.join(sourceDir, files[0]))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch({ buffer: false }, function (events) {
                var actual = events.pop();
                assert.ok(actual.contents);
                assert.ok(actual.contents instanceof Stream);
                done();
            }));

        setTimeout(touchFile, touchTimeout);
    });


});
