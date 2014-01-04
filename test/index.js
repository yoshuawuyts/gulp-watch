/* global describe, it */
'use strict';

delete require.cache[require.resolve('..')];
var watch = require('..');
var assert = require('power-assert');
var async = require('async');

describe('glob-batch', function () {
    it('should throw, if we provide invalid callback', function () {
        assert.throws(watch.bind(null, 'string'), /Provided callback is not a function/);
    });
});
