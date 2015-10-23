var _ = require('lodash');
var inflection = require('inflection');

module.exports = function Serializer (type, data, relations, options) {
  var defaults = {
    keyForAttribute: 'dash-case',
    keyForType: 'dash-case',
    keyForRelation: 'dash-case'
  };
  options = _.defaults(options, defaults);
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
  var relationships = parseRelations(data, relations);
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
      //console.log(property);
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
    var fk = getFK(relation);
    var value = data[fk];
    var relationship = null;
    var type = inflection.pluralize(relation.model);
    if (!_.isUndefined(value)) {
      delete data[fk];
      if (_.isArray(value)) {
        relationship = makeRelations(type, value);
      } else {
        relationship = makeRelation(type, value);
      }
      name = caserize(name, options.keyForRelation);
      relationships[name] = relationship;
    }
  });
  return relationships;
};

var makeRelation = function (type, id) {
  var data = {
    type: type,
    id: id
  };

  return {data: data};
};

var makeRelations = function (type, ids) {
  var res = [];
  _.each(ids, function (id) {
    res.push(makeRelation(type, id));
  });
  return res;
};

var getFK = function (relation) {
  //TODO: Added more relation types
  var many = ['referencesMany', 'hasMany'];
  var one = ['belongsTo', 'hasOne'];
  if (relation.foreignKey) {
    return relation.foreignKey;
  } else {
    var fk = inflection.camelize(relation.model, true);
    if (_.includes(many, relation.type)) {
      return fk + 'Ids';
    } else if (_.includes(one, relation.type)) {
      return fk + 'Id';
    } else {
      throw new Error('Not supported relationship ' + '`' + relation.type + '`');
    }
  }
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
    'camelCase': _.camelCase
  };
  var func = mapping[type];
  return func(value);
};
