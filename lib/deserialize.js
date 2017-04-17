/* global require,module */
var deserializer = require('./deserializer')
var RelUtils = require('./utilities/relationship-utils')
var utils = require('./utils')

module.exports = function (app, options) {
  /**
   * Register a handler to run before all remote methods so that we can
   * transform JSON API structured JSON payload into something loopback
   * can work with.
   */
  app.remotes().before('**', function (ctx, next) {
    var data, serverRelations, errors

    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    var regexs = [
      /^create$/,
      /^updateAttributes$/,
      /^patchAttributes$/
    ]

    var matches = regexs.filter(function (regex) {
      return regex.test(ctx.method.name)
    })

    /**
     * Handle include relationship requests (aka sideloading)
     */
    if (RelUtils.isRequestingIncludes(ctx)) {
      ctx.res.set({'Content-Type': 'application/vnd.api+json'})

      ctx.req.isSideloadingRelationships = true

      if (RelUtils.isLoopbackInclude(ctx)) {
        return next()
      }

      if (!RelUtils.shouldIncludeRelationships(ctx.req.method)) {
        return next(RelUtils.getInvalidIncludesError())
      }

      var include = RelUtils.getIncludesArray(ctx.req.query)
      include = include.length === 1 ? include[0] : include

      ctx.args = ctx.args || {}
      ctx.args.filter = ctx.args.filter || {}
      ctx.args.filter.include = include
    }

    if (utils.shouldApplyJsonApi(ctx, options) || matches.length > 0) {
      options.debug('Will deserialize incoming payload')
      options.debug('Set Content-Type to `application/vnd.api+json`')

      // set the JSON API Content-Type response header
      ctx.res.set({'Content-Type': 'application/vnd.api+json'})

      options.model = utils.getModelFromContext(ctx, app)
      options.method = ctx.method.name

      /**
       * Check the incoming payload data to ensure it is valid according to the
       * JSON API spec.
       */
      data = ctx.args.data

      if (!data) {
        return next()
      }

      options.debug('Validating payload data to be deserialized')
      errors = validateRequest(data, ctx.req.method)
      if (errors) {
        options.debug('Error:', errors)
        return next(new Error(errors))
      }

      options.data = data

      serverRelations = utils.getRelationsFromContext(ctx, app)

      options.relationships = serverRelations

      options.debug('======================')
      options.debug('Deserializer input    ')
      options.debug('======================')
      options.debug('DESERIALIZER OPTIONS |:', JSON.stringify(options))

      // transform the payload
      deserializer(options, function (err, deserializerOptions) {
        if (err) return next(err)

        options.data = deserializerOptions.data
        ctx.args.data = deserializerOptions.result

        options.debug('======================')
        options.debug('Deserializer output   ')
        options.debug('======================')
        options.debug('DESERIALIZED RESULT  |:', JSON.stringify(deserializerOptions.result))
        next()
      })
    } else {
      next()
    }
  })
}

/**
 * Check for errors in the request. If it has an error it will return a string, otherwise false.
 * @private
 * @memberOf {Deserialize}
 * @param {Object} data
 * @param {String} requestMethod
 * @return {String|false}
 */
function validateRequest (data, requestMethod) {
  if (!data.data) {
    return 'JSON API resource object must contain `data` property'
  }

  if (!data.data.type) {
    return 'JSON API resource object must contain `data.type` property'
  }

  if (['PATCH', 'PUT'].indexOf(requestMethod) > -1 && !data.data.id) {
    return 'JSON API resource object must contain `data.id` property'
  }

  return false
}
