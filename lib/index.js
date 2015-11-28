'use strict';

var _ = require('lodash');
var headers = require('./headers');
var patch = require('./patch');
var serialize = require('./serialize');
var deserialize = require('./deserialize');
var removeRemoteMethods = require('./removeRemoteMethods');
var create = require('./create');
var update = require('./update');
var del = require('./delete');
var errors = require('./errors');
var relationships = require('./relationships');
var debug = require('debug')('loopback-component-jsonapi');

module.exports = function (app, options) {
  var defaultOptions = {
    restApiRoot: '/api',
    enable: true
  };
  options = options || {};
  options = _.defaults(options, defaultOptions);

  if (!options.enable) {
    debug('Disabled');
    return;
  }
  debug('Started');
  options.debug = debug;
  headers(app, options);
  relationships(app, options);
  removeRemoteMethods(app, options);
  patch(app, options);
  serialize(app, options);
  deserialize(app, options);
  create(app, options);
  update(app, options);
  errors(app, options);
  del(app, options);

};
