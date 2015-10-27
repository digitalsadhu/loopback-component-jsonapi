var _ = require('lodash');
var inflection = require('inflection');

module.exports = function Deserializer (data, serverRelations) {

  var clientRelations = data.data.relationships;
  var result = data.data.attributes || {};
  if (_.isPlainObject(clientRelations)) {
    _.each(clientRelations, function (clientRelation, clientRelationName) {
      var serverRelation = serverRelations[clientRelationName];

      if (_.isPlainObject(serverRelation)) {
        var relationType = null;
        var relationValue = null;
        var fkSuffix = null;
        var fk = null;
        if (_.isArray(clientRelation.data)) {
          if (_.isEmpty(clientRelation.data)) {
            return;
          }
          relationType = _.result(_.find(clientRelation.data, 'type'), 'type');
          relationValue = _.map(clientRelation.data, function (val) {
            return val.id;
          });
          fkSuffix = 'Ids';
        } else {
          if (clientRelation.data === null) {
            return;
          }
          relationType = clientRelation.data.type;
          relationValue = clientRelation.data.id;
          fkSuffix = 'Id';
        }

        relationType = inflection.singularize(relationType);

        if (relationType === serverRelation.model) {
          if (serverRelation.foreignKey) {
            fk = serverRelation.foreignKey;
          } else {

            relationType = inflection.camelize(relationType, true);
            fk = relationType + fkSuffix;
          }
          result[fk] = relationValue;
        }
      }
    });
  }

  return result;

};
