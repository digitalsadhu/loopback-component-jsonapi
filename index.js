"use strict";

var headers = require('./headers');
var patch = require('./patch');
var serialize = require('./serialize');
var deserialize = require('./deserialize');
var removeRemoteMethods = require('./removeRemoteMethods');
var create = require('./create');
var update = require('./update');
var errors = require('./errors');

module.exports = function (app, options) {
  if (!options || !options.restApiRoot) {
    options = { restApiRoot: '/api' }
  }

  headers(app, options);
  removeRemoteMethods(app, options);
  patch(app, options);
  serialize(app, options);
  deserialize(app, options);
  create(app, options);
  update(app, options);
  errors(app, options);
}
