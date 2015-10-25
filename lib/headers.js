'use strict';
var is = require('type-is');

module.exports = function (app, options) {

  app.remotes().before('**', function (ctx, next) {
    if (ctx.req.accepts('application/vnd.api+json')) {
      ctx.req.headers.accept = 'application/json';
    }
    next();
  });

  app.remotes().options.rest = {
    //turn off strong remotings error handler so we can handle ourselves in error.js
    handleErrors: false,

    //extend support for application/vnd.api+json
    supportedTypes: ['json', 'application/javascript', 'text/javascript', 'application/vnd.api+json']
  };

  //extend rest body parser to also parse application/vnd.api+json
  app.remotes().options.json = {
    strict: false,
    type: function (req) {
      //if Content-Type is any of the following, then parse otherwise don't
      return !!is(req, ['json', 'application/json', 'application/vnd.api+json']);
    }
  };
};
