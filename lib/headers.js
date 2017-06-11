'use strict'
var is = require('type-is')
var _ = require('lodash')
var utils = require('./utils')

module.exports = function (app, options) {
  var remotes = app.remotes()

  remotes.before('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    options.debug('Add support for `application/vnd.api+json` accept headers')
    // We must force `application/json` until we can override it through strong remoting
    if (ctx.req.accepts('application/vnd.api+json')) {
      ctx.req.headers.accept = 'application/json'
    }

    next()
  })

  options.debug('Add `application/vnd.api+json` to supported types')
  var rest = remotes.options.rest = remotes.options.rest || {}
  rest.supportedTypes = rest.supportedTypes || []
  rest.supportedTypes = _.union(rest.supportedTypes, [
    'json',
    'application/javascript',
    'text/javascript',
    'application/vnd.api+json'
  ])

  // extend rest body parser to also parse application/vnd.api+json
  options.debug('Extend body parser to support `application/vnd.api+json`')
  remotes.options.json = remotes.options.json || {}
  remotes.options.json = _.extend(remotes.options.json, {
    strict: false,
    type: function (req) {
      // if Content-Type is any of the following, then parse otherwise don't
      return !!is(req, [
        'json',
        'application/json',
        'application/vnd.api+json'
      ])
    }
  })
}
