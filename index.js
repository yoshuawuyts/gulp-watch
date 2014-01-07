'use strict';

var Duplex = require('stream').Duplex,
    batch = require('gulp-batch'),
    Gaze = require('gaze'),
    gulp = require('gulp'),
    path = require('path'),
    gutil = require('gulp-util');

module.exports = function (opts, cb) {
    if (typeof opts !== 'object') {
        cb = opts;
        opts = { };
    }

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
        var count = 0;
        Object.keys(duplex.gaze.watched()).forEach(function (dir) {
            count += duplex.gaze.watched()[dir].length;
        });

        gutil.log(
            (opts.name ? gutil.colors.cyan(opts.name) + ' is watching': 'Watching'),
            gutil.colors.cyan(count),
            (count === 1 ? 'file...' : 'files...'));

        process.nextTick(duplex.emit.bind(duplex, 'ready'));
    });

    if (opts.glob) {
        process.nextTick(duplex.end.bind(duplex));
    }

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

        gulp.src([filepath], options)
            .on('data', done)
            .on('error', duplex.emit.bind(duplex, 'error'));
    }

    if (cb) {
        cb = batch(opts, cb.bind(duplex));
        cb.domain.on('error', duplex.emit.bind(duplex, 'error'));
    }

    duplex.gaze.on('all', createFile.bind(null, cb || duplex.push.bind(duplex)));

    return duplex;
};
