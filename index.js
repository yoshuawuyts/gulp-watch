'use strict';

module.exports = function (opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }

    if (typeof cb !== 'function') {
        throw new Error('Provided callback is not a function: ' + cb);
    }

    /* if (cb.length < 2) {
        process.nextTick(cb.bind(null, _batch));
    } else {
        holdOn = true;
        process.nextTick(cb.bind(null, _batch, async));
    }*/

};
