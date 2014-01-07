/* global describe, it, afterEach, before */
'use strict';

delete require.cache[require.resolve('..')];

var watch = require('..'),
    gulp = require('gulp'),
    assert = require('assert'),
    path = require('path'),
    fs = require('fs');

var fixtures = path.join(__dirname, 'fixtures'),
    allFixtures = path.join(fixtures, '**/*'),
    oneFixture = path.join(fixtures, 'test.js');

var touch = function (file) { fs.writeFileSync(file, path.basename(file)); };
var touchOneFixture = function () { touch(oneFixture); };

describe('Batching', function () {
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
            .on('error', done.bind(null, null));
        this.watcher.end();
    });

    it('should emit errors, when callback throws in async mode', function (done) {
        this.watcher = watch(function (events, cb) {
                throw new Error('Bang!');
            })
            .on('error', done.bind(null, null));
        this.watcher.end();
    });

    it('should emit errors, when callback call cb with error', function (done) {
        this.watcher = watch(function (events, cb) {
                cb(new Error('Bang!'));
            })
            .on('error', done.bind(null, null));
        this.watcher.end();
    });

    it('should call callback with detected event', function (done) {
        this.watcher = watch(function (events) {
                assert.equal(events.length === 1);
            })
            .on('error', done)
            .on('ready', touchOneFixture);

        this.watcher.write({ path: allFixtures });
        this.watcher.end();
    });

    it('should call callback with detected event in async mode', function (done) {
        this.watcher = watch(function (events, cb) {
                assert.equal(events.length === 1);
                cb();
            })
            .on('error', done)
            .on('ready', touchOneFixture);

        this.watcher.write({ path: allFixtures });
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
