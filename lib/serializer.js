var _ = require('lodash');
var inflection = require('inflection');
var utils = require('./utils');

module.exports = function Serializer (type, data, relations, options) {

  if (options.topLevelLinks.self.match(/\/relationships\//)) {
    options.topLevelLinks.related = options.topLevelLinks.self.replace('/relationships/', '/');
    options.isRelationshipRequest = true;
  } else {
    options.isRelationshipRequest = false;
  }
  var result = null;
  if (_.isArray(data)) {
    result = parseCollection(type, data, relations, options);
  } else if (_.isPlainObject(data)) {
    result = parseResource(type, data, relations, options);
  }

  var resultData = {};
  resultData.data = result;
  if (options.topLevelLinks) {
    resultData.links = makeLinks(options.topLevelLinks);
  }
  return resultData;
};

var parseResource = function (type, data, relations, options) {
  var resource = {};
  type = inflection.pluralize(type);
  type = caserize(type, options.keyForRelation);
  resource.type = type;
  var relationships = parseRelations(data, relations, options);
  if (!_.isEmpty(relationships)) {
    resource.relationships = relationships;
  }
  var attributes = {};
  _.each(data, function (value, property) {
    if (property === 'id') {
      resource.id = _(value).toString();
    } else {
      property = caserize(property, options.keyForAttribute);
      attributes[property] = value;
    }
  });
  if (_.isEmpty(attributes)) {
    return null;
  }
  if (options.isRelationshipRequest) {
    return resource;
  }
  resource.attributes = attributes;
  if (options.dataLinks) {
    resource.links = makeLinks(options.dataLinks, resource);
  }
  return resource;
};

var parseCollection = function (type, data, relations, link) {
  var result = [];
  _.each(data, function (value) {
    result.push(parseResource(type, value, relations, link));
  });

  return result;
};

var parseRelations = function (data, relations, options) {
  var relationships = {};
  _.each(relations, function (relation, name) {
    var pkName = relation.keyFrom;
    var fkName = relation.keyTo;

    //If relation is belongsTo then pk and fk are the other way around
    if (relation.type === 'belongsTo' || relation.type === 'referencesMany') {
      pkName = relation.keyTo;
      fkName = relation.keyFrom;
    }

    var pk = data[pkName];
    var fk = data[fkName];

    name = caserize(name, options.keyForRelation);
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
};

var makeRelation = function (type, id, options) {
  if (_.isEmpty(id)) {
    return null;
  }
  type = caserize(type, options.keyForRelation);
  var data = {
    type: type,
    id: id
  };

  return data;
};

var makeRelations = function (type, ids, options) {
  var res = [];
  _.each(ids, function (id) {
    res.push(makeRelation(type, id, options));
  });
  return res;
};

var makeLinks = function (links, item) {
  _.each(links, function (value, name) {
    if (_.isFunction(value)) {
      links[name] = value(item);
    } else {
      links[name] = _(value).toString();
    }
  });
  return links;
};

var caserize = function (value, type) {
  type = type || 'dash-case';
  var mapping = {
    'dash-case': _.kebabCase,
    'underscore_case': inflection.underscore,
    'camelCase': _.camelCase,
    'Classify': inflection.classify
  };
  var func = mapping[type];
  return func(value);
};
