"use strict";

var headers = require('./headers')
var serialize = require('./serialize');
var deserialize = require('./deserialize');

module.exports = function (app, options) {
  headers(app, options);
  serialize(app, options);
  deserialize(app, options);
}
