'use strict';
var Deserializer = require('./deserializer');

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

      var serverRelations = {};
      if (this.definition) {
        serverRelations = this.definition.settings.relations;
      }
      //transform the payload
      ctx.args.data = Deserializer(data, serverRelations);
      //TODO: Rewrite to normal search model by type and FK
    }

    next();
  });
};
