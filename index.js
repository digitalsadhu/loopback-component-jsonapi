"use strict";

var headers = require('./headers');
var patch = require('./patch');
var serialize = require('./serialize');
var deserialize = require('./deserialize');
var removeRemoteMethods = require('./removeRemoteMethods');
var create = require('./create');
var errors = require('./errors');

module.exports = function (app, options) {
  removeRemoteMethods(app, options);
  patch(app, options);
  serialize(app, options);
  deserialize(app, options);
  create(app, options);
  errors(app, options);
}
