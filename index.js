'use strict';

var Duplex = require('stream').Duplex,
    batch = require('gulp-batch'),
    Gaze = require('gaze'),
    gulp = require('gulp');

module.exports = function (opts, cb) {
    if (typeof opts !== 'object') {
        cb = opts;
        opts = { };
    }

    if (cb && typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    var gaze = new Gaze();

    var pathMap = {};

    var duplex = new Duplex({ objectMode: true, allowHalfOpen: true });
    duplex._write = function _write(file, encoding, done) {
        pathMap[file.path] = { cwd: file.cwd, base: file.base };
        gaze.add(file.path, done.bind(null, null));
    };

    duplex._read = function _read() { };

    duplex.close = function () {
        gaze.on('end', duplex.emit.bind(duplex, 'end'));
        gaze.close();
    };

    gaze.on('error', duplex.emit.bind(duplex, 'error'));

    duplex.on('finish', duplex.emit.bind(duplex, 'ready'));

    function createFile(done, event, filepath) {
        var options = {
            buffer: opts.buffer,
            read: opts.read,
            cwd: pathMap[filepath] ? pathMap[filepath].cwd : undefined,
            base: pathMap[filepath] ? pathMap[filepath].base : undefined
        };
        gulp.src([filepath], options)
            .on('data', done)
            .on('error', duplex.emit.bind(duplex, 'error'));
    }

    var domain = require('domain').create();
    domain.on('error', duplex.emit.bind(duplex, 'error'));

    gaze.on('all',
        createFile.bind(null,
            cb ?
                domain.bind(batch(opts, cb.bind(duplex))) :
                duplex.emit.bind(duplex, 'data')
        )
    );

    return duplex;
};
