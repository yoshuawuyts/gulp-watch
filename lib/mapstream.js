'use strict';

var Duplex = require('stream').Duplex;
var util = require('util');

function MapStream(map, options) {
    this.options = options || {};
    this.options.objectMode = this.options.objectMode || true;

    if (!(this instanceof MapStream)) {
        return new MapStream(options);
    }

    Duplex.call(this, options);

    this.map = map;
}

MapStream.prototype._write = function (object, encoding, cb) {
    this.map(object, function (error, mappedObject) {
        if (mappedObject) {
            this.push(mappedObject);
        }
        cb(error);
    }.bind(this));
};

util.inherits(MapStream, Duplex);
module.exports = MapStream;
