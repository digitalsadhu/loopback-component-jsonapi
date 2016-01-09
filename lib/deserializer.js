var _ = require('lodash');
var inflection = require('inflection');

/**
 * Deserializes the requests data.
 * @public
 * @type {Function}
 * @param {Object} data The request data
 * @param {Object} serverRelations
 * @return {Object}
 */
module.exports = function deserializer (data, serverRelations) {
  var clientRelations = data.data.relationships;
  var result = data.data.attributes || {};

  if (_.isPlainObject(clientRelations)) {
    _.each(clientRelations, function (relation, name) {
      if (serverRelations[name]) {
        handleClientRelations(data, result, serverRelations[name], relation);
      }
    });
  }

  return result;

};

/**
 * Modifies the result for each client relation.
 * @private
 * @memberOf {Deserializer}
 * @param {Object} data
 * @param {Object} result The result object to modify.
 * @param {Object} serverRelation
 * @param {Object} clientRelationf
 * @return {undefined}
 */
function handleClientRelations (data, result, serverRelation, clientRelation) {
  var relationType = null;
  var relationValue = null;
  var foreignKeySuffix = 'Id';
  var foreignKey = serverRelation.foreignKey;

  if (_.isPlainObject(serverRelation)) {
    if (_.isArray(clientRelation.data)) {
      if (_.isEmpty(clientRelation.data)) {
        relationValue = [];
      } else {
        relationType = _.result(_.find(clientRelation.data, 'type'), 'type');
        relationValue = _.map(clientRelation.data, function (val) {
          return val.id;
        });
      }

      // pluralize
      foreignKeySuffix += 's';
    } else {
      if (clientRelation.data) {
        relationType = clientRelation.data.type;
        relationValue = clientRelation.data.id;
      }
    }

    if (!relationType) {
      relationType = serverRelation.model;
    } else {
      relationType = inflection.singularize(relationType);
      if (relationType !== serverRelation.model) {
        return;
      }
    }

    if (!foreignKey) {
      relationType = inflection.camelize(relationType, true);
      foreignKey = relationType + foreignKeySuffix;
    }

    result[foreignKey] = relationValue;
  }
}
