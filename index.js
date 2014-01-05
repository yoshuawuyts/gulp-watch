'use strict';

var duplexer2 = require('duplexer2'),
    stream = require('stream'),
    batch = require('gulp-batch'),
    Gaze = require('gaze'),
    gulp = require('gulp');

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
        var options = {
            buffer: opts.buffer,
            read: opts.read,
            cwd: pathMap[filepath] ? pathMap[filepath].cwd : undefined,
            base: pathMap[filepath] ? pathMap[filepath].base : undefined
        };
        gulp.src([filepath], options)
            .on('data', function (file) {
                done(file);
            })
            .on('error', function (error) {
                duplex.emit.bind(duplex, 'error');
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
