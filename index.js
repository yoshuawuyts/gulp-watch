'use strict';

var duplexer2 = require('duplexer2'),
    stream = require('stream'),
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

    var gaze = new Gaze();

    var pathMap = {};

    var writable = new stream.Writable({objectMode: true});
    writable._write = function _write(file, encoding, done) {
        pathMap[file.path] = { cwd: file.cwd, base: file.base };
        gaze.add(file.path, done.bind(null, null));
    };

    var readable = new stream.Readable({objectMode: true});
    readable._read = function _read() { };

    var duplex = duplexer2({ allowHalfOpen: true }, writable, readable);

    duplex.close = function () {
        gaze.on('end', duplex.emit.bind(duplex, 'end'));
        gaze.close();
    };

    writable.on('finish', function () {
        duplex.emit('ready');
    });

    function createFile(done, event, filepath) {
        var file = new File({
            path: filepath,
            base: pathMap[filepath] ? pathMap[filepath].base : undefined,
            cwd: pathMap[filepath] ? pathMap[filepath].cwd : undefined
        });

        var tasks = { stat: fs.stat.bind(fs, filepath) };
        if (opts.read) {
            tasks.contents = opts.buffer ?
                fs.readFile.bind(fs, filepath) :
                function (done) { done(null, fs.createReadStream(filepath)); };
        }

        async.parallel(tasks, function (err, results) {
            var nullContent = err || !results.contents;
            file.contents = nullContent ? null : results.contents;
            file.stat = results.stat;
            done(file);
        });
    }

    var domain = require('domain').create();
    domain.on('error', function (error) {
        duplex.emit('error', error);
    });

    gaze.on('all', cb ?
        createFile.bind(null, domain.bind(batch(opts, cb.bind(duplex)))) :
        createFile.bind(null, readable.emit.bind(readable, 'data'))
    );

    return duplex;
};
