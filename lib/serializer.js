var _ = require('lodash')
var RelUtils = require('./utilities/relationship-utils')
var utils = require('./utils')

function defaultBeforeSerialize (options, cb) {
  cb(null, options)
}

function defaultSerialize (options, cb) {
  var result = null
  var resultData = {}

  if (_.isArray(options.results)) {
    result = parseCollection(options.type, options.results, options.relationships, options)
  } else if (_.isPlainObject(options.results)) {
    result = parseResource(options.type, options.results, options.relationships, options)
  }

  if (options.topLevelLinks) {
    resultData.links = makeLinks(options.topLevelLinks)
  }

  resultData.data = result
  if (options.meta) resultData.meta = options.meta

  /**
   * If we're requesting to sideload relationships...
   */
  if (options.requestedIncludes) {
    try {
      handleIncludes(resultData, options.requestedIncludes, options.relationships, options.app)
    } catch (err) {
      cb(err)
    }
  }

  options.results = resultData
  cb(null, options)
}

function defaultAfterSerialize (options, cb) {
  cb(null, options)
}

module.exports = function serializer (type, data, relations, options, cb) {
  options = _.clone(options)
  options.attributes = options.attributes || {}

  options.isRelationshipRequest = false

  if (options.topLevelLinks.self.match(/\/relationships\//)) {
    options.topLevelLinks.related = options.topLevelLinks.self.replace('/relationships/', '/')
    options.isRelationshipRequest = true
  }
  var serializeOptions
  var model = options.model

  var beforeSerialize = (typeof model.beforeJsonApiSerialize === 'function') ?
    model.beforeJsonApiSerialize : defaultBeforeSerialize

  var serialize = (typeof model.jsonApiSerialize === 'function') ?
    model.jsonApiSerialize : defaultSerialize

  var afterSerialize = (typeof model.afterJsonApiSerialize === 'function') ?
    model.afterJsonApiSerialize : defaultAfterSerialize

  serializeOptions = _.assign(options, {
    type: type,
    results: data,
    relationships: _.cloneDeep(relations)
  })
  beforeSerialize(serializeOptions, function (err, serializeOptions) {
    if (err) return cb(err)
    serialize(serializeOptions, function (err, serializeOptions) {
      if (err) return cb(err)
      afterSerialize(serializeOptions, function (err, serializeOptions) {
        if (err) return cb(err)
        return cb(null, serializeOptions.results)
      })
    })
  })
}

/**
 * Parses a a request and returns a resource
 * @private
 * @memberOf {Serializer}
 * @param {String} type
 * @param {Object} data
 * @param {Object} relations
 * @param {Object} options
 * @return {Object|null}
 */
function parseResource (type, data, relations, options) {
  var resource = {}
  var attributes = {}
  var relationships

  resource.type = type
  relationships = parseRelations(data, relations, options)

  if (!_.isEmpty(relationships)) {
    resource.relationships = relationships
  }

  if (options.foreignKeys !== true) {
    // Remove any foreign keys from this resource
    options.app.models().forEach(function (model) {
      _.each(model.relations, function (relation) {
        var fkModel = relation.modelTo
        var fkName = relation.keyTo
        if (utils.relationFkOnModelFrom(relation)) {
          fkModel = relation.modelFrom
          fkName = relation.keyFrom
        }
        if (fkModel === options.model && fkName !== options.primaryKeyField) {
          // check options and decide whether to remove foreign keys.
          if (options.foreignKeys !== false && Array.isArray(options.foreignKeys)) {
            for (var i = 0; i < options.foreignKeys.length; i++) {
              // if match on model
              if (options.foreignKeys[i].model === fkModel.sharedClass.name) {
                // if no method specified
                if (!options.foreignKeys[i].method) return
                // if method match
                if (options.foreignKeys[i].method === options.method) return
              }
            }
          }
          delete data[fkName]
        }
      })
    })
  }

  _.each(data, function (value, property) {
    if (property === options.primaryKeyField) {
      resource.id = _(value).toString()
    } else {
      if (!options.attributes[type] || _.includes(options.attributes[type], property)) {
        attributes[property] = value
      }
    }
  })

  if (_.isUndefined(resource.id)) {
    return null
  }

  // if it's a relationship request
  if (options.isRelationshipRequest) {
    return resource
  }

  resource.attributes = attributes
  if (options.dataLinks) {
    resource.links = makeLinks(options.dataLinks, resource)
  }

  return resource
}

/**
 * Parses a collection of resources
 * @private
 * @memberOf {Serializer}
 * @param {String} type
 * @param {Object} data
 * @param {Object} relations
 * @param {Object} options
 * @return {Array}
 */
function parseCollection (type, data, relations, options) {
  var result = []

  _.each(data, function (value) {
    result.push(parseResource(type, value, relations, options))
  })

  return result
}

/**
 * Parses relations from the request.
 * @private
 * @memberOf {Serializer}
 * @param {Object} data
 * @param {Object} relations
 * @param {Object} options
 * @return {Object}
 */
function parseRelations (data, relations, options) {
  var relationships = {}

  _.each(relations, function (relation, name) {
    var fkName = relation.keyTo

    // If relation is belongsTo then fk is the other way around
    if (utils.relationFkOnModelFrom(relation)) {
      fkName = relation.keyFrom
    }

    var pk = data[options.primaryKeyField]
    var fk = data[fkName]

    var toType = ''
    if (relation.polymorphic && utils.relationFkOnModelFrom(relation)) {
      var discriminator = relation.polymorphic.discriminator
      var model = options.app.models[data[discriminator]]
      toType = utils.pluralForModel(model)
    } else {
      toType = utils.pluralForModel(relation.modelTo)
    }

    // Relationship `links` should always be defined unless this is a
    // relationship request
    if (!options.isRelationshipRequest) {
      relationships[name] = {
        links: {
          related: options.host + options.restApiRoot + '/' + options.modelPath + '/' + pk + '/' + name
        }
      }
    }

    var relationship = null

    if (!_.isUndefined(fk)) {
      if (_.isArray(fk)) {
        relationship = makeRelations(toType, fk, options)
      } else {
        relationship = makeRelation(toType, fk, options)
      }
    }

    // No `data` key should be present unless there is actual relationship data.
    if (relationship) {
      relationships[name].data = relationship
    }
  })

  return relationships
}

/**
 * Responsible for making a relations.
 * @private
 * @memberOf {Serializer}
 * @param {String} type
 * @param {String|Number} id
 * @param {Object} options
 * @return {Object|null}
 */
function makeRelation (type, id, options) {
  if (_.isEmpty(id)) {
    return null
  }

  return {
    type: type,
    id: id
  }
}

/**
 * Handles a creating a collection of relations.
 * @private
 * @memberOf {Serializer}
 * @param {String} type
 * @param {Array} ids
 * @param {Object} options
 * @return {Array}
 */
function makeRelations (type, ids, options) {
  var res = []

  _.each(ids, function (id) {
    res.push(makeRelation(type, id, options))
  })

  return res
}

/**
 * Makes links to an item.
 * @private
 * @memberOf {Serializer}
 * @param {Object} links
 * @param {Mixed} item
 * @return {Object}
 */
function makeLinks (links, item) {
  var retLinks = {}

  _.each(links, function (value, name) {
    if (_.isFunction(value)) {
      retLinks[name] = value(item)
    } else {
      retLinks[name] = _(value).toString()
    }
  })

  return retLinks
}

/**
 * Handles serializing the requested includes to a seperate included property
 * per JSON API spec.
 * @private
 * @memberOf {Serializer}
 * @param {Object} resp
 * @param {Array<String>|String}
 * @throws {Error}
 * @return {undefined}
 */
function handleIncludes (resp, includes, relations, app) {
  var resources = _.isArray(resp.data) ? resp.data : [resp.data]

  if (typeof includes === 'string') {
    includes = [ includes ]
  }

  if (!_.isArray(includes)) {
    throw RelUtils.getInvalidIncludesError('JSON API unable to detect valid includes')
  }

  var embedded = resources.map(function subsituteEmbeddedForIds (resource) {
    return includes.map(function (include) {
      var relation = relations[include]
      var propertyKey = relation.keyFrom
      var plural = ''
      if (relation.polymorphic && utils.relationFkOnModelFrom(relation)) {
        var discriminator = resource.attributes[relation.polymorphic.discriminator]
        plural = utils.pluralForModel(app.models[discriminator])
      } else {
        plural = utils.pluralForModel(relation.modelTo)
      }
      var embeds = []

      // If relation is belongsTo then pk and fk are the other way around
      if (utils.relationFkOnModelFrom(relation)) {
        propertyKey = relation.keyTo
      }

      if (!relation) {
        throw RelUtils.getInvalidIncludesError('Can\'t locate relationship "' + include + '" to include')
      }

      resource.relationships[include] = resource.relationships[include] || {}

      if (resource.relationships[include] && resource.attributes[include]) {
        if (_.isArray(resource.attributes[include])) {
          embeds = resource.attributes[include].map(function (rel) {
            rel = utils.clone(rel)
            return createCompoundIncludes(rel, propertyKey, relation.keyTo, plural)
          })
          embeds = _.compact(embeds)

          resource.relationships[include].data = resource.attributes[include].map(function (relData) {
            return {
              id: String(relData[propertyKey]),
              type: plural
            }
          })
        } else {
          var rel = utils.clone(resource.attributes[include])
          var compoundIncludes = createCompoundIncludes(rel, propertyKey, relation.keyFrom, plural)

          resource.relationships[include].data = {
            id: String(resource.attributes[include][propertyKey]),
            type: plural
          }
          embeds.push(compoundIncludes)
        }
        delete resource.attributes[relation.keyFrom]
        delete resource.attributes[relation.keyTo]
        delete resource.attributes[include]
      }
      return embeds
    })
  })

  if (embedded.length) {
    resp.included = _.flattenDeep(embedded)
  }
}

/**
 * Creates a compound include object.
 * @private
 * @memberOf {Serializer}
 * @param {Object} relationship
 * @param {String} key
 * @param {String} type
 * @return {Object}
 */
function createCompoundIncludes (relationship, key, fk, type) {
  var compoundInclude = makeRelation(type, String(relationship[key]))

  // remove the id key since its part of the base compound document, not part of attributes
  delete relationship[key]
  delete relationship[fk]

  // The rest of the data goes in the attributes
  compoundInclude.attributes = relationship

  return compoundInclude
}
