'use strict';

var PassThrough = require('stream').PassThrough,
    batch = require('gulp-batch'),
    File = require('gulp-util').File,
    Gaze = require('gaze'),
    fs = require('fs'),
    async = require('async');

module.exports = function (opts, cb) {
    if (typeof opts !== 'object') {
        cb = opts;
        opts = { };
    }

    opts.timeout = opts.timeout || 500;

    if (typeof opts.read !== 'boolean') { opts.read = true; }
    if (typeof opts.buffer !== 'boolean') { opts.buffer = true; }

    if (cb && typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    if (cb) {
        cb = batch(opts, cb);
    }

    var gaze = new Gaze();

    var through = new PassThrough({objectMode: true})
        .on('data', function (file) {
            gaze.add(file.path);
        })
        .on('unwatch', function () {
            gaze.on('end', this.emit.bind(this, 'end'));
            gaze.close();
        });

    function createFile(cb, event, filepath) {
        var file = new File({ path: filepath });
        file.event = event;
        var tasks = { stat: fs.stat.bind(fs, filepath) };
        if (opts.read) {
            tasks.content = opts.buffer ?
                fs.readFile.bind(fs, filepath) :
                function (cb) { cb(null, fs.createReadStream(filepath)); };
        }
        async.parallel(tasks, function (err, results) {
            file.content = results.content;
            file.stat = results.stat;
            cb(file);
        });
    }

    gaze.on('all', cb ?
        createFile.bind(null, cb) :
        createFile.bind(null, through.emit.bind(through, 'data'))
    );

    return through;
};
