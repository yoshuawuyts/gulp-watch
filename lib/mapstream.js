'use strict';

var Duplex = require('stream').Duplex;
var util = require('util');

function MapStream(map, options) {
    this.options = options || {};
    this.options.objectMode = this.options.objectMode || true;

    if (!(this instanceof MapStream)) {
        return new MapStream(this.options);
    }

    Duplex.call(this, options);

    this.map = map;

    // this.buffer = [];
}

util.inherits(MapStream, Duplex);

MapStream.prototype._write = function (object, encoding, cb) {
    this.map(object, function (error, mappedObject) {
        if (mappedObject) {
            this.push(mappedObject);
        }
        cb(error);
    }.bind(this));
};

MapStream.prototype._read = function (n) {
    /* if (this.buffer.length) {
        this.push(this.buffer.unshift());
    }*/
};


module.exports = MapStream;
