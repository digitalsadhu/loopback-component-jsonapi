'use strict'

/* global module,require */
var serializer = require('./serializer')
var utils = require('./utils')
var _ = require('lodash')
var url = require('url')
var regexs = [
  /^find$/,
  /^create$/,
  /^deleteById$/,
  /^findById$/,
  /^__get__.*/,
  /^updateAttributes$/,
  /^patchAttributes$/,
  /^__findRelationships__.*/
]

module.exports = function (app, defaults) {
  defaults.debug('Register jsonapi serializer')
  app.remotes().after('**', function (ctx, next) {
    var data,
      type,
      path,
      options,
      modelNamePlural,
      modelPath,
      relatedModel,
      relatedModelPlural,
      relatedModelPath,
      relations,
      model

    if (utils.shouldNotApplyJsonApi(ctx, defaults)) {
      return next()
    }

    var matches = regexs.filter(function (regex) {
      return regex.test(ctx.method.name)
    })

    if (!utils.shouldApplyJsonApi(ctx, defaults) && !matches.length) {
      return next()
    }

    // housekeeping, just skip verbs we definitely aren't
    // interested in handling.
    switch (ctx.req.method) {
      case 'DELETE':
      case 'PUT':
      case 'HEAD':
        return next()
    }

    defaults.debug('Response will be serialized')
    defaults.debug('Set response Content-Type to `application/vnd.api+json`')
    ctx.res.set({
      'Content-Type': 'application/vnd.api+json'
    })

    data = utils.clone(ctx.result)
    model = utils.getModelFromContext(ctx, app)
    modelNamePlural = utils.pluralForModel(model)
    modelPath = utils.httpPathForModel(model)
    type = modelNamePlural
    path = modelPath
    relations = utils.getRelationsFromContext(ctx, app)

    /**
     * HACK: specifically when data is null and GET :model/:id
     * is being accessed, we should not treat null as ok. It needs
     * to be 404'd and to do that we just exit out of this
     * after remote hook and let the middleware chain continue
     */
    if (!data && ctx.method.name === 'findById') {
      return next()
    }

    var primaryKeyField = utils.primaryKeyForModel(model)
    var regexRelationFromUrl = /\/.*\/(.*$)/g
    var regexMatches = regexRelationFromUrl.exec(ctx.req.path)
    var relationName = regexMatches && regexMatches[1] ? regexMatches[1] : null

    var relation = model.relations[relationName]
    if (relationName && relation) {
      if (relation.polymorphic && utils.relationFkOnModelFrom(relation)) {
        let discriminator = relation.polymorphic.discriminator
        discriminator = utils.clone(ctx.instance)[discriminator]
        relatedModel = app.models[discriminator]
      } else {
        relatedModel = relation.modelTo
      }
      relatedModelPlural = utils.pluralForModel(relatedModel)
      relatedModelPath = utils.httpPathForModel(relatedModel)
      primaryKeyField = utils.primaryKeyForModel(relatedModel)

      if (relatedModelPlural) {
        type = relatedModelPlural
        model = relatedModel
        path = relatedModelPath
        relations = model.relations
      }
    }

    options = {
      app: app,
      model: model,
      modelPath: path,
      method: ctx.method.name,
      meta: ctx.meta ? utils.clone(ctx.meta) : null,
      primaryKeyField: primaryKeyField,
      host: defaults.host || utils.hostFromContext(ctx),
      dataLinks: {
        self: function (item) {
          var urlComponents = url.parse(options.host)
          var args = [
            urlComponents.protocol.replace(':', ''),
            urlComponents.host,
            options.restApiRoot,
            path,
            item.id
          ]

          return utils.buildModelUrl.apply(this, args)
        }
      }
    }
    options.topLevelLinks = {
      self: options.host + ctx.req.originalUrl
    }

    options = _.defaults(options, defaults)

    defaults.debug('===================')
    defaults.debug('Serialization input')
    defaults.debug('===================')
    defaults.debug('JSONAPI TYPE      |:', type)
    defaults.debug('SERIALIZER OPTS   |:', JSON.stringify(options))
    defaults.debug('RELATIONS DEFN    |:', JSON.stringify(relations))
    defaults.debug('DATA TO SERIALIZE |:', JSON.stringify(data))

    // Serialize our request
    serializer(type, data, relations, options, function (err, results) {
      if (err) return next(err)

      ctx.result = results

      defaults.debug('====================')
      defaults.debug('Serialization output')
      defaults.debug('====================')
      defaults.debug('SERIALIZED DATA    |:', JSON.stringify(results))
      next()
    })
  })
}
