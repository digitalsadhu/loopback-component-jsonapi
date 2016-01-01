'use strict';
var is = require('type-is');
var _ = require('lodash');

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.before('**', function (ctx, next) {
    // We must force `application/json` until we can override it through strong remoting
    if (ctx.req.accepts('application/vnd.api+json')) {
      ctx.req.headers.accept = 'application/json';
    }

    next();
  });

  var rest = remotes.options.rest = remotes.options.rest || {};
  rest.supportedTypes = rest.supportedTypes || [];
  rest.supportedTypes = _.union(rest.supportedTypes, [
    'json',
    'application/javascript',
    'text/javascript',
    'application/vnd.api+json'
  ]);

  //extend rest body parser to also parse application/vnd.api+json
  remotes.options.json = {
    strict: false,
    type: function (req) {
      //if Content-Type is any of the following, then parse otherwise don't
      return !!is(req, ['json', 'application/json', 'application/vnd.api+json']);
    }
  };
};
