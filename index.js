'use strict';

var es = require('event-stream');
var batch = require('gulp-batch');
var Gaze = require('gaze');

function batched(cb, event) {
    // Do we need to stream this events next?
    // through.emit('data', event);
    cb(event);
}

function streamed(event) {
    this.emit('data', event);
}

module.exports = function (opts, cb) {
    if (typeof opts !== 'object') {
        cb = opts;
        opts = {};
    }

    if (cb && typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    if (cb) {
        cb = batch(opts, cb);
    }

    var gaze = new Gaze();

    var through = es.through(function write(file) {
        gaze.add(file.path);
    }, function end() {
        // Neverending story
    });

    gaze.on('all', cb ? batched.bind(null, cb) : streamed.bind(through));

    return through;
};
