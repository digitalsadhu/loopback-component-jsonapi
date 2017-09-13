'use strict'

var _ = require('lodash')
var utils = require('./utils')
const linkRelatedModels = require(
  './utilities/relationship-utils'
).linkRelatedModels

module.exports = function (app, options) {
  // get remote methods.
  // set strong-remoting for more information
  // https://github.com/strongloop/strong-remoting
  var remotes = app.remotes()
  var id, data, model

  remotes.before('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    var allowedMethodNames = ['updateAttributes', 'patchAttributes']
    var methodName = ctx.method.name
    if (allowedMethodNames.indexOf(methodName) === -1) return next()

    id = ctx.req.params.id
    data = options.data
    model = utils.getModelFromContext(ctx, app)

    relationships(id, data, model).then(() => next()).catch(err => next(err))
  })

  // for create
  remotes.after('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    if (ctx.method.name !== 'create') return next()

    if (ctx.result && ctx.result.data) {
      id = ctx.result.data.id
      data = options.data
      model = utils.getModelFromContext(ctx, app)
      return relationships(id, data, model)
        .then(() => next())
        .catch(err => next(err))
    }

    next()
  })
}

function extractIdsFromResource (resource) {
  if (_.isArray(resource)) {
    return _.map(resource, 'id')
  }
  return _.get(resource, 'id', null)
}

function relationships (id, payload, ModelFrom) {
  if (!id || !ModelFrom) return
  const relationships = _.get(payload, 'data.relationships', {})

  return Promise.all(
    Object.keys(relationships).map(name => {
      const relationship = relationships[name]
      const relationDefn = ModelFrom.relations[name]
      if (!relationDefn) return

      const type = relationDefn.type
      const ModelTo = relationDefn.modelTo

      // don't handle belongsTo in relationships function
      if (!ModelTo || type === 'belongsTo') return

      const data = extractIdsFromResource(relationship.data)
      return linkRelatedModels(name, ModelFrom, id, ModelTo, data)
    })
  )
}
