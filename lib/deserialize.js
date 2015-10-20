'use strict';
var _ = require('lodash');
var inflection = require('inflection');

module.exports = function (app) {
  var remotes = app.remotes();
  //register a handler to run before all remote methods so that we can
  //transform JSON API structured JSON payload into something loopback
  //can work with.

  remotes.before('**', function (ctx, next) {

    var regexs = [
      /\.create/,
      /prototype\.updateAttributes/,
      /prototype\.__createRelationships__/,
      /prototype\.__updateRelationships__/
    ];

    var matches = regexs.filter(function (regex) {
      return ctx.methodString.match(regex);
    });

    if (matches.length > 0) {

      //set the JSON API Content-Type response header
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});

      //check the incoming payload data to ensure it is valid according to the
      //JSON API spec.
      var data = ctx.args.data;

      if (!data) return next();

      if (!data.data) return next(new Error('JSON API resource object must contain `data` property'));
      if (!data.data.type) return next(new Error('JSON API resource object must contain `data.type` property'));
      if (ctx.req.method === 'PATCH') {
        if (!data.data.id) return next(new Error('JSON API resource object must contain `data.id` property'));
      }

      //transform the payload
      ctx.args.data = data.data.attributes || {};
      //TODO: Rewrite to normal search model by type and FK
      var clientRelations = data.data.relationships;
      var serverRelations = this.definition.settings.relations;
      if (_.isPlainObject(clientRelations)) {
        _.each(clientRelations, function (clientRelation, clientRelationName) {
          var serverRelation = serverRelations[clientRelationName];

          if (_.isPlainObject(serverRelation)) {
            var relationType = null;
            var relationValue = null;
            var fkSuffix = null;
            var fk = null;
            if (_.isArray(clientRelation.data)) {
              relationType = _.result(_.find(clientRelation.data, 'type'), 'type');
              relationValue = _.map(clientRelation.data, function (val) {
                return val.id;
              });
              fkSuffix = 'Ids';
            } else {
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
              console.log(fk, relationValue);
              ctx.args.data[fk] = relationValue;
            }
          }
        });
      }
    }

    next();
  });
};
