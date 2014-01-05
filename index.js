'use strict';

var MapStream = require('./lib/mapstream'),
    PassThrough = require('stream').PassThrough,
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

    if (typeof opts.read !== 'boolean') { opts.read = true; }
    if (typeof opts.buffer !== 'boolean') { opts.buffer = true; }

    if (cb && typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    if (cb) {
        cb = batch(opts, cb);
    }

    var gaze = new Gaze();

    var pathMap = {};

    var reciever = new MapStream(function (file, cb) {
        pathMap[file.path] = { cwd: file.cwd, base: file.base };
        gaze.add(file.path, cb.bind(null, null));
    });

    var emitter = new PassThrough({ objectMode: true });

    reciever.on('flush', function () {
        // Source stream is ended and all files is watched
        emitter.emit('ready');
    });

    function createFile(cb, event, filepath) {
        var file = new File({
            path: filepath,
            base: pathMap[filepath] ? pathMap[filepath].base : undefined,
            cwd: pathMap[filepath] ? pathMap[filepath].cwd : undefined
        });

        var tasks = { stat: fs.stat.bind(fs, filepath) };
        if (opts.read) {
            tasks.contents = opts.buffer ?
                fs.readFile.bind(fs, filepath) :
                function (cb) { cb(null, fs.createReadStream(filepath)); };
        }

        async.parallel(tasks, function (err, results) {
            var nullContent = err || !results.contents;
            file.contents = nullContent ? null : results.contents;
            file.stat = results.stat;
            cb(file);
        });
    }

    gaze.on('all', cb ?
        createFile.bind(null, cb.bind(emitter)) :
        createFile.bind(null, emitter.emit.bind(emitter, 'data'))
    );

    emitter.close = function () {
        gaze.on('end', emitter.emit.bind(emitter, 'end'));
        gaze.close();
    };

    return reciever.pipe(emitter, { end: false });
};
