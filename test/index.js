/* global describe, it */
'use strict';

delete require.cache[require.resolve('..')];
var watch = require('..');
var assert = require('assert');
// var async = require('async');
var Stream = require('stream').Stream;

describe('glob-watch', function () {
    it('should throw, if we provide invalid callback', function () {
        assert.throws(watch.bind(null, 'string'), /Provided callback is not a function/);
    });

    it('should return stream', function () {
        assert.ok(watch() instanceof Stream, 'Stream was not returned');
        assert.ok(watch(function () { }) instanceof Stream, 'Stream was not returned');
    });
});
