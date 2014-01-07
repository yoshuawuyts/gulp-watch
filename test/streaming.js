/* global describe, it, afterEach, before */

'use strict';

delete require.cache[require.resolve('..')];

var watch = require('..'),
    assert = require('assert'),
    path = require('path'),
    gulp = require('gulp'),
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

describe('Streaming', function () {
    describe('Options', function () {
        it('option.passThrough should pass events with default value', function (done) {
            this.watcher = watch()
                .on('data', function (file) {
                    assert.ok(file);
                    done();
                })
                .on('error', done);
            this.watcher.write(this.expected);
        });

        it('option.passThrough should block events with `false`', function (done) {
            this.watcher = watch({ passThrough: false })
                .on('data', done)
                .on('error', done)
                .on('end', done.bind(null, null));
            this.watcher.write(this.expected);
            this.watcher.close();
        });

        it('option.buffer `false` should make contents Stream', function (done) {
            this.watcher = watch({ buffer: false, passThrough: false })
                .on('data', function (file) {
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
            this.watcher = watch({ read: false, passThrough: false })
                .on('data', function (file) {
                    assert.ok(!file.contents);
                    done();
                })
                .on('error', done)
                .on('ready', touchOneFixture);
            this.watcher.write(this.expected);
            this.watcher.end();
        });

    });
    
    describe('Glob mode', function () {
        it('should emit `ready`', function (done) {
            this.watcher = watch({ glob: allFixtures })
                .on('ready', done);
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

    describe('Pipe mode', function () {

        it('should emit `ready`', function (done) {
            this.watcher = watch()
                .on('ready', done);
            this.watcher.write({ path: allFixtures });
            this.watcher.end();
        });

        it('should detect changes on file', function (done) {
            this.watcher = watch()
                .on('data', done.bind(null, null))
                .on('ready', touchOneFixture);

            this.watcher.write({ path: allFixtures });
        });

        it('should preserve File object', function (done) {
            this.watcher =
                watch()
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
            this.watcher.write(this.expected);
            this.watcher.end();
        });

        it('should emit `end` when closing watcher', function (done) {
            this.watcher = watch()
                .on('end', done)
                .close();
        });

        it('should not emit `finish` when gulp.src ends', function (done) {
            this.watcher = watch()
                .on('finish', done)
                .end();
        });

        it('should not emit `end` when gulp.src ends', function (done) {
            this.watcher = watch()
                .on('finish', done)
                .on('end', done.bind(null, '`end` was emitted'));
            this.watcher.end();
        });

        it('should not emit `end` with watching files', function (done) {
            this.watcher = watch()
                .on('finish', done)
                .on('end', done.bind(null, '`end` was emitted'));
            this.watcher.write(this.expected);
            this.watcher.end();
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