"use strict";

var headers = require('./headers');
var patch = require('./patch');
var serialize = require('./serialize');
var deserialize = require('./deserialize');

module.exports = function (app, options) {
  headers(app, options);
  patch(app, options);
  serialize(app, options);
  deserialize(app, options);
}
