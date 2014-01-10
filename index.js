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

    var upstream_count = 0;
    duplex._write = function _write(file, encoding, done) {
        upstream_count++;
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

    // Files gather, and now my watch begins.
    // It shall not end until my death.
    // I shall take no wife, hold no lands, father no children.
    // ...
    var watching = false;
    var beginWatch  = function(count, from) {

        count = count || getWatchedFiles(duplex.gaze).length;

        gutil.log(
            (opts.name ? gutil.colors.cyan(opts.name) + ' is watching': 'Watching'),
            gutil.colors.cyan(count),
            (count === 1 ? 'file' : 'files'),
            (from !== void 0 ? from : '...'));

        if(!watching) {
            process.nextTick(duplex.emit.bind(duplex, 'ready'));
            watching = true;
        }
    }

    duplex.on('finish', function () {
        beginWatch(upstream_count, 'received from the pipe.');
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
        if (opts.emitOnGlob === true) {

            var file_glob_count = 0;
            gulp.src(opts.glob, opts)
                .on('data', function(){file_glob_count++})
                .on('data', cb || duplex.push.bind(duplex))
                .on('error', duplex.emit.bind(duplex, 'error'))
                .on('end', beginWatch.bind(null, file_glob_count, 'from the glob: ' + opts.glob));
        } else {
            beginWatch(null, 'from the glob: ' + opts.glob);
        }
    }

    return duplex;
};
