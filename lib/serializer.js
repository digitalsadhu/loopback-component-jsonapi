var _ = require('lodash');
var RelUtils = require('./utilities/relationship-utils');
var utils = require('./utils');

module.exports = function serializer (type, data, relations, options) {

  var result = null;
  var resultData = {};

  options.isRelationshipRequest = false;

  if (options.topLevelLinks.self.match(/\/relationships\//)) {
    options.topLevelLinks.related = options.topLevelLinks.self.replace('/relationships/', '/');
    options.isRelationshipRequest = true;
  }

  if (_.isArray(data)) {
    result = parseCollection(type, data, relations, options);
  } else if (_.isPlainObject(data)) {
    result = parseResource(type, data, relations, options);
  }

  resultData.data = result;

  if (options.topLevelLinks) {
    resultData.links = makeLinks(options.topLevelLinks);
  }

  /**
   * If we're requesting to sideload relationships...
   */
  if (options.requestedIncludes) {
    handleIncludes(resultData, options.requestedIncludes, relations);
  }

  return resultData;
};

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
  var resource = {};
  var attributes = {};
  var relationships;

  resource.type = type;
  relationships = parseRelations(data, relations, options);

  if (!_.isEmpty(relationships)) {
    resource.relationships = relationships;
  }

  _.each(data, function (value, property) {
    if (property === options.primaryKeyField) {
      resource.id = _(value).toString();
    } else {
      attributes[property] = value;
    }
  });

  // If there is no attributes found return
  if (_.isEmpty(attributes)) {
    return null;
  }

  // if it's a relationship request
  if (options.isRelationshipRequest) {
    return resource;
  }

  resource.attributes = attributes;
  if (options.dataLinks) {
    resource.links = makeLinks(options.dataLinks, resource);
  }

  return resource;
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
  var result = [];

  _.each(data, function (value) {
    result.push(parseResource(type, value, relations, options));
  });

  return result;
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
  var relationships = {};

  var topLevel = options.topLevelLinks.self;
  var parts = topLevel.split('/');
  var collection = parts[parts.length - 1];

  _.each(relations, function (relation, name) {

    var fkName = relation.keyTo;

    // If relation is belongsTo then fk is the other way around
    if (relation.type === 'belongsTo' || relation.type === 'referencesMany') {
      fkName = relation.keyFrom;
    }

    // Items of /:collection and /:collection/:id/:relatedcollection
    // should have the same relationship object.
    // Without this /:collection/:id/:relatedcollection relationship
    // object is the same as /:collection/:id's.
    if (collection === name) {
      // fk should not be leaked out of the server
      delete data[fkName];
      relationships = parseRelations(data, relation.modelTo.relations, options);
      return false;
    }

    var pk = data[options.primaryKeyField];
    var fk = data[fkName];

    var fromType = utils.pluralForModel(relation.modelFrom);
    var toType = utils.pluralForModel(relation.modelTo);

    // Relationship `links` should always be defined unless this is a
    // relationship request
    if (!options.isRelationshipRequest) {

      relationships[name] = {
        links: {
          related: options.host + options.restApiRoot + '/' + fromType + '/' + pk + '/' + name
        }
      };
    }

    var relationship = null;

    if (!_.isUndefined(fk)) {
      // fk should not be leaked out of the server
      delete data[fkName];

      if (_.isArray(fk)) {
        relationship = makeRelations(toType, fk, options);
      } else {
        relationship = makeRelation(toType, fk, options);
      }
    }

    //No `data` key should be present unless there is actual relationship data.
    if (relationship) {
      relationships[name].data = relationship;
    }
  });

  return relationships;
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
    return null;
  }

  return {
    type: type,
    id: id
  };
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
  var res = [];

  _.each(ids, function (id) {
    res.push(makeRelation(type, id, options));
  });

  return res;
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
  var retLinks = {};

  _.each(links, function (value, name) {
    if (_.isFunction(value)) {
      retLinks[name] = value(item);
    } else {
      retLinks[name] = _(value).toString();
    }
  });

  return retLinks;
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
function handleIncludes (resp, includes, relations) {
  var resources = _.isArray(resp.data) ? resp.data : [resp.data];

  if (typeof includes === 'string') {
    includes = [ includes ];
  }

  if (!_.isArray(includes)) {
    throw RelUtils.getInvalidIncludesError('JSON API unable to detect valid includes');
  }

  var embedded = resources.map(function subsituteEmbeddedForIds (resource) {
    return includes.map(function (include) {
      var relation = relations[include];
      var propertyKey = relation.keyFrom;
      var plural = utils.pluralForModel(relation.modelTo);
      var embeds = [];

      // If relation is belongsTo then pk and fk are the other way around
      if (relation.type === 'belongsTo' || relation.type === 'referencesMany') {
        propertyKey = relation.keyTo;
      }

      if (!relation) {
        throw RelUtils.getInvalidIncludesError('Can\'t locate relationship "' + include + '" to include');
      }
      if (resource.relationships[include] && resource.attributes[include]) {
        if (_.isArray(resource.attributes[include])) {
          embeds = resource.attributes[include].map(function (rel) {
            rel = utils.clone(rel);
            return createCompoundIncludes(rel, propertyKey, plural);
          });
          embeds = _.compact(embeds);

          resource.attributes[include] = _.map(embeds, 'id');
        } else {
          var rel = utils.clone(resource.attributes[include]);
          var compoundIncludes = createCompoundIncludes(rel, propertyKey, plural);
          resource.attributes[include] = String(resource.attributes[include][propertyKey]);

          embeds.push(compoundIncludes);
        }
      }
      return embeds;
    });
  });

  if (embedded.length) {
    resp.included = _.flattenDeep(embedded);
  }
}

/**
 * Creates a compound include object.
 * @private
 * @memberOf {Serializer}
 * @param {Object} relationship
 * @param {String} id
 * @param {String} type
 * @return {Object}
 */
function createCompoundIncludes (relationship, key, type) {
  var compoundInclude = makeRelation(type, String(relationship[key]));

  // remove the id key since its part of the base compound document, not part of attributes
  delete relationship[key];

  // The rest of the data goes in the attributes
  compoundInclude.attributes = relationship;

  return compoundInclude;
}
