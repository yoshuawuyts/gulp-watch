# [gulp](https://github.com/gulpjs/gulp)-watch [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
> Watch, that you expect

This is problem solver for [this issue](https://github.com/gulpjs/gulp/issues/84) with [gulp.watch](https://github.com/gulpjs/gulp#gulpwatchglob-cb).

## Usage

### Trigger for mocha

```js
// npm i gulp gulp-watch gulp-mocha

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var watch = require('gulp-watch');
var gutil = require('gulp-util')

gulp.task('mocha', function () {
    return gulp.src(['test/*.js'])
        .pipe(mocha({ reporter: 'list' }))
        .on('error', gutil.log);
});

gulp.src(['lib/**', 'test/**']).pipe(watch(function(events, cb) {
    gulp.run('mocha', cb);
});
```


### Continious stream of events

```js
// npm i gulp gulp-watch gulp-saas

var gulp = require('gulp');
var watch = require('gulp-watch');
var sass = require('gulp-sass');

gulp.src('scss/**').pipe(watch()).pipe(sass());
```

## API

### watch([options, callback])

This function creates have two different modes, that are depends on have you provice callback function, or not. If you do - you get __batched__ mode, if you not - you get __stream__.

__Callback signature__: `function(events, [done])`.

 * `events` - is `Array` of incoming events.
 * `done` - is callback for your function signal to batch, that you are done. This allows to run your callback as soon as previous end.

__Options__:

This object passed to [`gaze` options](https://github.com/shama/gaze#properties) directly, so see documentation there.

For __batched__ mode only:

 * `debounce` - Minimal interval between calling callback after `done` (only works with async callback) (default: `0`)
 * `limit` - Maximum events number, that gets into one batch (default: `undefined` - unlimited)
 * `timeout` - Interval in milliseconds, that counts as "no more events will arrive" (default: `200`)

__Returns__:

 * __Batched mode__  - wrapped callback, that will gather events and call callback.
 * __Stream mode__ - stream, that handles `gulp.src` piping.

# License

(MIT License)

Copyright (c) 2013 Vsevolod Strukchinsky (floatdrop@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm-url]: https://npmjs.org/package/gulp-watch
[npm-image]: https://badge.fury.io/js/gulp-watch.png

[travis-url]: http://travis-ci.org/floatdrop/gulp-watch
[travis-image]: https://travis-ci.org/floatdrop/gulp-watch.png?branch=master

[depstat-url]: https://david-dm.org/floatdrop/gulp-watch
[depstat-image]: https://david-dm.org/floatdrop/gulp-watch.png
