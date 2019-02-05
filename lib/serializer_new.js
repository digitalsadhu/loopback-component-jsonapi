'use strict'

var _ = require('lodash')
const serialize = require('loopback-jsonapi-model-serializer')

function defaultBeforeSerialize (options, cb) {
  cb(null, options)
}

function defaultSerialize (options, cb) {
  var result = {}

  if (options.results !== null) {
    result = serialize(options.results, options.model, {
      baseUrl: 'http://127.0.0.1'
    })
  } else {
    result.data = null
  }

  if (options.topLevelLinks) {
    result.links = makeLinks(options.topLevelLinks)
  }

  if (options.meta) {
    result.meta = options.meta
  }

  if (options.attributes) {
    if (_.isArray(result.data)) {
      result.data.forEach(function (item) {
        item.attributes = filterAttributes(item, options)
      })
    } else if (result.data !== null) {
      result.data.attributes = filterAttributes(result.data, options)
    }
  }

  options.results = result
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
    options.topLevelLinks.related = options.topLevelLinks.self.replace(
      '/relationships/',
      '/'
    )
    options.isRelationshipRequest = true
  }
  var serializeOptions
  var model = options.model

  var beforeSerialize = typeof model.beforeJsonApiSerialize === 'function'
    ? model.beforeJsonApiSerialize
    : defaultBeforeSerialize

  var serialize = typeof model.jsonApiSerialize === 'function'
    ? model.jsonApiSerialize
    : defaultSerialize

  var afterSerialize = typeof model.afterJsonApiSerialize === 'function'
    ? model.afterJsonApiSerialize
    : defaultAfterSerialize

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

function filterAttributes (data, options) {
  var allowedAttributes = options.attributes || {}
  var type = data.type

  if (_.has(allowedAttributes, type)) {
    return _.pick(data.attributes, allowedAttributes[type])
  }
  return data.attributes
}
