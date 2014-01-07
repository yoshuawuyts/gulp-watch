/* global describe, it, afterEach, before */
'use strict';

delete require.cache[require.resolve('..')];

var watch = require('..'),
    gulp = require('gulp'),
    assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    Stream = require('stream').Stream;

var fixtures = path.join(__dirname, 'fixtures'),
    allFixtures = path.join(fixtures, '**/*'),
    oneFixture = path.join(fixtures, 'test.js');

var touch = function (file) {
    setTimeout(function () {
        fs.writeFileSync(file, path.basename(file));
    }, 1000);
};
var touchOneFixture = function () { touch(oneFixture); };

describe('Batching', function () {

    describe('Options', function () {
        it('option.passThrough should pass events with default value', function (done) {
            this.watcher = watch(function () {})
                .on('data', done.bind(null, null))
                .on('error', done);
            this.watcher.write(this.expected);
        });

        it('option.passThrough should block events with `false`', function (done) {
            this.watcher = watch({ passThrough: false },
                function (events) {
                    done();
                })
                .on('data', done)
                .on('error', done)
                .on('ready', touchOneFixture);
            this.watcher.write(this.expected);
            this.watcher.end();
        });

        it('option.buffer `false` should make contents Stream', function (done) {
            this.watcher = watch({ buffer: false }, function (events) {
                    assert.equal(events.length, 1);
                    var file = events.pop();
                    assert.ok(file.contents);
                    assert.ok(file.contents instanceof Stream);
                    done();
                })
                .on('error', done)
                .on('ready', touchOneFixture);
            this.watcher.write(this.expected);
            this.watcher.end();
        });

        it('option.read should remove contents from emitted files', function (done) {
            this.watcher = watch({ read: false }, function (events) {
                    assert.equal(events.length, 1);
                    var file = events.pop();
                    assert.ok(!file.contents);
                    done();
                })
                .on('error', done)
                .on('ready', touchOneFixture);
            this.watcher.write(this.expected);
            this.watcher.end();
        });

    });

    it('should emit `ready` event', function (done) {
        this.watcher = watch(function () { }).on('ready', done);
        this.watcher.end();
    });

    it('should emit `data`', function (done) {
        this.watcher = watch(function () { })
            .on('data', done.bind(null, null))
            .on('ready', touchOneFixture);
        this.watcher.write({ path: allFixtures });
        this.watcher.end();
    });

    it('should emit errors, when callback throws', function (done) {
        this.watcher = watch(function () {
                throw new Error('Bang!');
            })
            .on('ready', touchOneFixture)
            .on('error', done.bind(null, null));
        this.watcher.write(this.expected);
        this.watcher.end();
    });

    it('should emit errors, when callback throws in async mode', function (done) {
        this.watcher = watch(function (events, cb) {
                throw new Error('Bang!');
            })
            .on('ready', touchOneFixture)
            .on('error', done.bind(null, null));
        this.watcher.write(this.expected);
        this.watcher.end();
    });

    it('should emit errors, when callback call cb with error', function (done) {
        this.watcher = watch(function (events, cb) {
                cb(new Error('Bang!'));
            })
            .on('ready', touchOneFixture)
            .on('error', done.bind(null, null));
        this.watcher.write(this.expected);
        this.watcher.end();
    });

    it('should call callback with detected event', function (done) {
        this.watcher = watch(function (events) {
                assert.equal(events.length, 1);
                done();
            })
            .on('error', done)
            .on('ready', touchOneFixture);

        this.watcher.write(this.expected);
        this.watcher.end();
    });

    it('should call callback with detected event in async mode', function (done) {
        this.watcher = watch(function (events, cb) {
                assert.equal(events.length, 1);
                done();
                cb();
            })
            .on('error', done)
            .on('ready', touchOneFixture);

        this.watcher.write(this.expected);
        this.watcher.end();
    });

    it('should emit `end` when closing watcher', function (done) {
        this.watcher = watch(function () { })
            .on('end', done)
            .close();
    });

    it('should not emit `finish` when gulp.src ends', function (done) {
        this.watcher = watch(function () { })
            .on('finish', done)
            .end();
    });

    it('should not emit `end` when gulp.src ends', function (done) {
        this.watcher = watch(function () { })
            .on('finish', done)
            .on('end', done.bind(null, '`end` was emitted'));
        this.watcher.end();
    });

    it('should not emit `end` with watching files', function (done) {
        this.watcher = watch(function () { })
            .on('finish', done)
            .on('end', done.bind(null, '`end` was emitted'));
        this.watcher.write({ path: oneFixture });
        this.watcher.end();
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
