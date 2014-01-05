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

function touchFile(file) {
    file = file || files[0];
    fs.writeFileSync(path.join(sourceDir, file), file);
}

function touchFiles() {
    files.map(touchFile);
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
        gulp.src(sourceFiles)
            .pipe(watch(function (events) {
                assert.equal(events.length, 3);
                this.close();
            }))
            .on('ready', touchFiles.bind(null, null))
            .on('error', done)
            .on('end', done);
    });

    it('should capture events with stream version', function (done) {
        function check(file) {
            assert.ok(files.indexOf(file.relative) !== -1);
        }

        var iterator = async.iterator([
            check, check,
            function (file) {
                check(file);
                pipe.close();
            }
        ]);

        var pipe = gulp.src(sourceFiles).pipe(watch())
            .on('data', function (file) {
                iterator = iterator(file);
            })
            .on('ready', touchFiles.bind(null, null))
            .on('error', done)
            .on('end', done);

    });

    it('should preserve contents and stat', function (done) {
        var expected;

        gulp.src(path.join(sourceDir, '*'))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch(function (events) {
                var actual = events.pop();
                assert.ok(actual.contents);
                assert.deepEqual(actual.contents, expected.contents);
                assert.ok(actual.stat);
                this.close();
            }))
            .on('ready', touchFile.bind(null, null))
            .on('error', done)
            .on('end', done);
    });

    it('should support `read: false` option', function (done) {
        var expected;
        gulp.src(path.join(sourceDir, files[0]))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch({ read: false }, function (events) {
                var actual = events.pop();
                assert.ok(!actual.contents);
                assert.ok(actual.stat);
                this.close();
            }))
            .on('ready', touchFile.bind(null, null))
            .on('error', done)
            .on('end', done);
    });

    it('should support `buffer: false` option', function (done) {
        var expected;
        gulp.src(path.join(sourceDir, files[0]))
            .on('data', function (file) {
                expected = file;
            })
            .pipe(watch({ buffer: false }, function (events) {
                var actual = events.pop();
                assert.ok(actual.contents);
                assert.ok(actual.contents instanceof Stream);
                this.close();
            }))
            .on('ready', touchFile.bind(null, null))
            .on('error', done)
            .on('end', done);
    });


});
