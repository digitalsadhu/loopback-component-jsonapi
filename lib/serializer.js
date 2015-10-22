var _ = require('lodash');
var inflection = require('inflection');

module.exports = function Serializer (type, data, relations, link) {

  var result = null;
  if (_.isArray(data)) {
    result = parseCollection(type, data, relations, link);
  } else if (_.isPlainObject(data)) {
    result = parseResource(type, data, relations, link);
  }

  return {data: result};
};

var parseResource = function (type, data, relations, link) {
  var resource = {};
  type = inflection.pluralize(type);
  resource.type = type;
  var relationships = parseRelations(data, relations);
  if (!_.isEmpty(relationships)) {
    resource.relationships = relationships;
  }
  resource.attributes = {};
  _.each(data, function (value, property) {
    if (property === 'id') {
      resource.id = _(value).toString();
    } else {
      resource.attributes[property] = value;
    }
  });
  resource.links = {
    self: makeSelfLink(link, type, resource.id)
  };
  return resource;
};

var parseCollection = function (type, data, relations, link) {
  var result = [];
  _.each(data, function (value) {
    result.push(parseResource(type, value, relations, link));
  });

  return result;
};

var parseRelations = function (data, relations) {
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

var makeSelfLink = function (link, type, id) {
  return link.url + '/' + type + '/' + id;
};
