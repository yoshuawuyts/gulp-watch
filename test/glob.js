/* global describe, it, afterEach, before */

'use strict';

delete require.cache[require.resolve('..')];

var watch = require('..'),
    assert = require('assert'),
    path = require('path'),
    gulp = require('gulp'),
    fs = require('fs'),
    gutil = require('gulp-util'),
    Stream = require('stream').Stream;

var fixtures = path.join(__dirname, 'fixtures'),
    allFixtures = path.join(fixtures, '**/*'),
    topFixtures = path.join(fixtures, '*'),
    oneFixture = path.join(fixtures, 'test.js'),
    subFixture = path.join(fixtures, 'subfolder', 'subfile.js');

var touch = function (file) {
    setTimeout(function () {
        fs.writeFileSync(file, path.basename(file));
    }, 1000);
};
var touchOneFixture = function () { touch(oneFixture); };

describe('Glob', function () {
    describe('Batching', function () {
        it('should emit `ready` event', function (done) {
            this.watcher = watch({ glob: oneFixture },
                function () { })
                .on('ready', done);
        });

        it('should emit `data`', function (done) {
            this.watcher = watch({ glob: allFixtures }, function () { })
                .on('data', done.bind(null, null))
                .on('ready', touchOneFixture);
        });

        it('should emit `end` when closing watcher', function (done) {
            this.watcher = watch({ glob: allFixtures }, function () { })
                .on('end', done)
                .close();
        });

        it('should emit `finish` when gulp.src ends', function (done) {
            this.watcher = gulp.src(topFixtures)
                .pipe(watch({ glob: subFixture }, function () { }))
                .on('finish', done);
        });

        it('should not emit `end` when gulp.src ends', function (done) {
            this.watcher = watch({ glob: subFixture }, function () { })
                .on('ready', done)
                .on('end', done.bind(null, '`end` was emitted'));
            this.watcher.end();
        });

        it('should not emit `end` with watching files', function (done) {
            this.watcher = watch({ glob: subFixture }, function () { })
                .on('ready', done)
                .on('end', done.bind(null, '`end` was emitted'));
        });
    });

    describe('Streaming', function () {
        it('should emit `ready` when glob option ready', function (done) {
            var noop = gutil.noop();
            this.watcher = noop
                .pipe(watch({ glob: subFixture }))
                .on('ready', touch.bind(null, subFixture))
                .on('data', function (data) { assert.ok(data); done(); });
            noop.write(this.expected);
        });

        it('should support piping in', function (done) {
            this.watcher = gulp.src(subFixture)
                .pipe(watch({ glob: topFixtures }))
                .on('ready', touchOneFixture)
                .on('data', function (data) { assert.ok(data); done(); });
        });

        it('should emit `ready`', function (done) {
            this.watcher = watch({ glob: allFixtures })
                .on('ready', setTimeout.bind(null, done, 10));
        });

        it('should emit `data`', function (done) {
            this.watcher = watch({ glob: allFixtures })
                .on('ready', touchOneFixture)
                .on('data', function (data) { assert.ok(data); done(); })
                .on('error', done);
        });

        it('should emit `end` on close', function (done) {
            watch({ glob: allFixtures })
                .on('end', done)
                .close();
        });

        it('should detect changes on file', function (done) {
            this.watcher = watch({ glob: allFixtures })
                .on('data', done.bind(null, null))
                .on('ready', touchOneFixture);
        });

        it('should preserve File object', function (done) {
            this.watcher =
                watch({ glob: allFixtures })
                .on('data', function (actual) {
                    try {
                        assert.equal(actual.path, this.expected.path);
                        assert.equal(actual.cwd, this.expected.cwd);
                        assert.equal(actual.base, this.expected.base);
                        assert.equal(actual.relative, this.expected.relative);
                        assert.deepEqual(actual.contents, this.expected.contents);
                    } catch (e) {
                        return done(e);
                    }
                    done();
                }.bind(this))
                .on('error', done)
                .on('ready', touchOneFixture);
        });
    });

    before(function (done) {
        gulp.src(oneFixture)
            .on('data', function (file) {
                this.expected = file;
                done();
            }.bind(this))
            .on('error', done);
    });

    afterEach(function (done) {
        if (this.watcher) {
            this.watcher.removeAllListeners('end');
            this.watcher.removeAllListeners('finish');
            this.watcher.removeAllListeners('ready');
            this.watcher.removeAllListeners('data');
            this.watcher.on('end', done);
            this.watcher.close();
            this.watcher = undefined;
        } else {
            done();
        }
    });

});