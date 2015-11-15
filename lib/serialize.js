'use strict';

var Serializer = require('./serializer');
var utils = require('./utils');
var _ = require('lodash');

module.exports = function (app, defaults) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {

    var regexs = [
      /\.find/,
      /\.create/,
      /\.deleteById/,
      /\.findById/,
      /prototype\.__get__/,
      /prototype\.updateAttributes/,
      /prototype\.__findRelationships__/,
      /prototype\.__createRelationships__/,
      /prototype\.__updateRelationships__/
    ];

    var matches = regexs.filter(function (regex) {
      return ctx.methodString.match(regex);
    });

    if (matches.length === 0) return next();

    ctx.res.set({
      'Content-Type': 'application/vnd.api+json'
    });
    //housekeeping, just skip verbs we definitely aren't
    //interested in handling.
    if (ctx.req.method === 'DELETE') return next();
    if (ctx.req.method === 'PUT') return next();
    if (ctx.req.method === 'HEAD') return next();

    var data = utils.clone(ctx.result);

    var modelName = utils.modelNameFromContext(ctx);

    //HACK: specifically when data is null and GET :model/:id
    //is being accessed, we should not treat null as ok. It needs
    //to be 404'd and to do that we just exit out of this
    //after remote hook and let the middleware chain continue
    if (data === null && ctx.method.name === 'findById') {
      return next();
    }

    var type = modelName;
    //match on __GET__, etc.
    if (ctx.methodString.match(/.*\.__.*__.*/)) {
      //get the model name of the related model in plural form.
      //we cant just get the relationship name because the name of
      //the relationship may not match the related model plural.
      //eg. /posts/1/author could actually be a user model so we
      //would want type = 'users'

      //WARNING: feels fragile but functional.
      var relatedModelName = ctx.method.returns[0].type;
      var relatedModelPlural = utils.pluralForModel(app.models[relatedModelName]);
      if (relatedModelPlural) {
        type = relatedModelPlural;
      }

    }

    var options = {
      host: utils.hostFromContext(ctx),
      topLevelLinks: {
        self: utils.urlFromContext(ctx)
      },
      dataLinks: {
        self: function (item) {
          if (relatedModelPlural) {
            return utils.buildModelUrl(ctx.req.protocol, ctx.req.get('host'), options.restApiRoot, relatedModelPlural, item.id);
          }
          return utils.buildModelUrl(ctx.req.protocol, ctx.req.get('host'), options.restApiRoot, utils.pluralForModel(app.models[modelName]), item.id);
        }
      }
    };
    options = _.defaults(options, defaults);
    var relations = utils.getRelationsFromContext(ctx, app);
    var res = Serializer(type, data, relations, options);
    ctx.result = res;

    next();
  });
};
