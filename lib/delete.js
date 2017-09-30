'use strict'

const utils = require('./utils')
const statusCodes = require('http-status-codes')

module.exports = function (app, options) {
  // get remote methods.
  // set strong-remoting for more information
  // https://github.com/strongloop/strong-remoting
  const remotes = app.remotes()

  // register after remote method hook on all methods
  remotes.after('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    // in this case we are only interested in handling create operations.
    if (ctx.method.name === 'deleteById') {
      // JSON API specifies that successful
      // deletes with no content returned should be 204
      if (ctx.res.statusCode === statusCodes.OK) {
        ctx.res.status(statusCodes.NO_CONTENT)
      }
    }
    next()
  })
}
