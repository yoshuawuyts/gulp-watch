/* global describe, it, afterEach */
'use strict';

delete require.cache[require.resolve('..')];
var watch = require('..'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    es = require('event-stream'),
    plumber = require('gulp-plumber');

var fixtures = path.join(__dirname, 'fixtures'),
    allFixtures = path.join(fixtures, '**/*'),
    oneFixture = path.join(fixtures, 'test.js');

var touch = function (file) {
    setTimeout(function () {
        fs.writeFileSync(file, path.basename(file));
    }, 1000);
};
var touchOneFixture = function () { touch(oneFixture); };
var touchAllFixtures = function () { allFixtures.forEach(touch); };

var failingStream = new es.through(function (file) {
    this.emit('error', new Error('Bang!'));
});

describe('Integration', function () {

    it('should emit data on underlying stream failing', function (done) {
        this.watcher = watch({ glob: allFixtures })
            .on('data', function (file) {
                assert.equal(path.basename(file.path), 'test.js');
                done();
            })
            .on('error', done)
            .on('ready', touchOneFixture);
        this.watcher
            .pipe(failingStream)
            .on('error', function (error) {
                assert.ok((/Bang!/g).test(error));
            });
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

});
