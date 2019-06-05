'use strict'

var _ = require('lodash')
var utils = require('./utils')

function defaultBeforeDeserialize (options, cb) {
  cb(null, options)
}

function defaultDeserialize (options, cb) {
  options.result = options.data.data.attributes || {}
  cb(null, options)
}

function defaultAfterDeserialize (options, cb) {
  cb(null, options)
}

/**
 * Deserializes the requests data.
 * @public
 * @type {Function}
 * @param {Object} data The request data
 * @param {Object} serverRelations
 * @return {Object}
 */
module.exports = function deserializer (options, cb) {
  var model = options.model

  var beforeDeserialize = typeof model.beforeJsonApiDeserialize === 'function'
    ? model.beforeJsonApiDeserialize
    : defaultBeforeDeserialize

  var deserialize = typeof model.jsonApiDeserialize === 'function'
    ? model.jsonApiDeserialize
    : defaultDeserialize

  var afterDeserialize = typeof model.afterJsonApiDeserialize === 'function'
    ? model.afterJsonApiDeserialize
    : defaultAfterDeserialize

  var deserializeOptions = _.cloneDeep(options)

  beforeDeserialize(deserializeOptions, function (err, deserializeOptions) {
    if (err) return cb(err)
    deserialize(deserializeOptions, function (err, deserializeOptions) {
      if (err) return cb(err)
      afterDeserialize(deserializeOptions, function (err, deserializeOptions) {
        if (err) return cb(err)

        belongsToRelationships(deserializeOptions)
        return cb(null, deserializeOptions)
      })
    })
  })
}

function belongsToRelationships (options) {
  var data = options.data
  var model = options.model

  if (!data || !data.data || !model || !data.data.relationships) {
    return
  }

  _.each(data.data.relationships, function (relationship, name) {
    var serverRelation = model.relations[name]
    if (!serverRelation) return
    var type = serverRelation.type

    // only handle belongsTo
    if (type !== 'belongsTo') return

    var fkName = serverRelation.keyFrom
    var modelTo = serverRelation.modelFrom

    if (!modelTo) return false

    if (!relationship.data) {
      options.result[fkName] = null
    } else {
      if (serverRelation.polymorphic) {
        // Find the model which has a plural matching 'data.type'
        // Allow case insensitive match
        var relatedType = relationship.data.type.toLowerCase()
        var modelName = _.findKey(model.app.models, function (model) {
          var plural = utils.pluralForModel(model)
          return plural.toLowerCase() === relatedType
        })
        if (!modelName) {
          return false
        }
        var discriminator = serverRelation.polymorphic.discriminator
        options.result[discriminator] = modelName
      }
      options.result[fkName] = relationship.data.id
    }
  })
}
