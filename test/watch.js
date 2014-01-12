/* global describe, it, afterEach */
'use strict';

delete require.cache[require.resolve('..')];
var watch = require('..'),
    assert = require('assert'),
    stream = require('stream'),
    Stream = stream.Stream,
    fs = require('fs'),
    path = require('path');

var fixtures = path.join(__dirname, 'fixtures'),
    allFixtures = path.join(fixtures, '**/*'),
    oneFixture = path.join(fixtures, 'test.js');

var touch = function (file) {
    setTimeout(function () {
        fs.writeFileSync(file, path.basename(file));
    }, 1000);
};
var touchOneFixture = function () { touch(oneFixture); };

describe('Constructor', function () {

    it('should throw, if we provide invalid callback', function () {
        assert.throws(watch.bind(null, 'string'), /Provided callback is not a function/);
    });

    afterEach(function (done) {
        if (this.watcher) {
            this.watcher.on('end', done);
            this.watcher.close();
            this.watcher = undefined;
        } else {
            done();
        }
    });

    it('should return stream without callback', function () {
        this.watcher = watch();
        assert.ok(this.watcher instanceof Stream, 'Stream was not returned');
    });

    it('should return stream with callback', function () {
        this.watcher = watch(function () { });
        assert.ok(this.watcher instanceof Stream, 'Stream was not returned');
    });
});
