'use strict';
var _ = require('lodash');

module.exports = function (app) {
  var remotes = app.remotes();

  function deserializeJSONAPIPayload (ctx, next) {

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
      var relations = data.data.relationships;
      if (_.isPlainObject(relations)) {
        _.each(relations, function (relationData, relation) {
          var fk = relation + 'Id'; //replace on FK from model
          ctx.args.data[fk] = relationData.data.id;
        });
      }
    }

    next();
  }

  //register a handler to run before all remote methods so that we can
  //transform JSON API structured JSON payload into something loopback
  //can work with.
  remotes.before('**', deserializeJSONAPIPayload);
};
