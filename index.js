'use strict';

var PassThrough = require('stream').PassThrough;
var batch = require('gulp-batch');
var File = require('gulp-util').File;
var Gaze = require('gaze');

function createFile(event, filepath) {
    var file = new File({ path: filepath });
    file.event = event;
    return file;
}

function batched(cb, event, filepath) {
    // Do we need to stream this events next?
    // through.emit('data', event);
    cb(createFile(event, filepath));
}

function streamed(event, filepath) {
    /*jshint validthis:true */
    this.emit('data', createFile(event, filepath));
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

    var through = new PassThrough({objectMode: true});
    through.on('data', function (file) {
        gaze.add(file.path);
    });

    gaze.on('all', cb ? batched.bind(null, cb) : streamed.bind(through));

    return through;
};
