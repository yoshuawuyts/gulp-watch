'use strict';

var Duplex = require('stream').Duplex,
    batch = require('gulp-batch'),
    Gaze = require('gaze'),
    gulp = require('gulp'),
    path = require('path'),
    gutil = require('gulp-util');

function getWatchedFiles(gaze) {
    var files = [];
    var watched = gaze.watched();
    Object.keys(watched).forEach(function (dir) {
        files = files.concat(watched[dir]);
    });
    return files;
}

module.exports = function (opts, cb) {
    if (typeof opts !== 'object') {
        cb = opts;
        opts = { };
    }

    opts.emit = opts.emit || 'one';

    if (cb && typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    var pathMap = {};

    var duplex = new Duplex({ objectMode: true, allowHalfOpen: true });
    duplex.gaze = new Gaze(opts.glob);

    duplex._write = function _write(file, encoding, done) {
        pathMap[file.path] = { cwd: file.cwd, base: file.base };
        duplex.gaze.add(file.path, done.bind(null, null));
        if (opts.passThrough !== false) { duplex.push(file); }
    };

    duplex._read = function _read() { };

    duplex.close = function () {
        duplex.gaze.on('end', duplex.emit.bind(duplex, 'end'));
        duplex.gaze.close();
    };

    duplex.gaze.on('error', duplex.emit.bind(duplex, 'error'));

    duplex.on('finish', function () {
        var count = getWatchedFiles(duplex.gaze).length;

        gutil.log(
            (opts.name ? gutil.colors.cyan(opts.name) + ' is watching': 'Watching'),
            gutil.colors.cyan(count),
            (count === 1 ? 'file...' : 'files...'));

        process.nextTick(duplex.emit.bind(duplex, 'ready'));
    });

    function createFile(done, event, filepath) {

        var msg = [gutil.colors.magenta(path.basename(filepath)), 'was', event];
        if (opts.name) { msg.unshift(gutil.colors.cyan(opts.name) + ' saw'); }
        gutil.log.apply(gutil, msg);

        var options = {
            buffer: opts.buffer,
            read: opts.read,
            cwd: pathMap[filepath] ? pathMap[filepath].cwd : undefined,
            base: pathMap[filepath] ? pathMap[filepath].base : undefined
        };

        var glob = [filepath];

        if (opts.emit === 'all') { glob = getWatchedFiles(duplex.gaze); }

        gulp.src(glob, options)
            .on('data', done)
            .on('error', duplex.emit.bind(duplex, 'error'));
    }

    if (cb) {
        cb = batch(opts, cb.bind(duplex));
        cb.domain.on('error', duplex.emit.bind(duplex, 'error'));
    }

    duplex.gaze.on('all', createFile.bind(null, cb || duplex.push.bind(duplex)));

    if (opts.glob) {
        if (opts.passThrough) {
            gulp.src(opts.glob, opts)
                .on('data', cb)
                .on('error', duplex.emit.bind(duplex, 'error'));
        } else {
            process.nextTick(duplex.end.bind(duplex));
        }
    }

    return duplex;
};
