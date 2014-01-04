'use strict';

var es = require('event-stream');
var batch = require('gulp-batch');
var Gaze = require('gaze');

function batched(cb, event, filepath) {
    // Do we need to stream this events next?
    // through.emit('data', event);
    cb({ type: event, path: filepath });
}

function streamed(event, filepath) {
    /*jshint validthis:true */
    this.emit('data', { type: event, path: filepath });
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
