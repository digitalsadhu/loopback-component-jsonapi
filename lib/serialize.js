/* global module,require */
var serializer = require('./serializer');
var utils = require('./utils');
var _ = require('lodash');
var regexs = [
  /^find$/,
  /^create$/,
  /^deleteById$/,
  /^findById$/,
  /^__get__.*/,
  /^updateAttributes$/,
  /^__findRelationships__.*/
];

module.exports = function (app, defaults) {
  app.remotes().after('**', function (ctx, next) {
    var data,
      type,
      options,
      modelNamePlural,
      relatedModelPlural,
      relations,
      model,
      requestedIncludes;

    if (utils.shouldNotApplyJsonApi(ctx, defaults)) {
      return next();
    };

    var matches = regexs.filter(function (regex) {
      return regex.test(ctx.method.name);
    });

    if (!utils.shouldApplyJsonApi(ctx, defaults) && !matches.length) {
      return next();
    }

    ctx.res.set({
      'Content-Type': 'application/vnd.api+json'
    });

    //housekeeping, just skip verbs we definitely aren't
    //interested in handling.
    switch (ctx.req.method) {
      case 'DELETE':
      case 'PUT':
      case 'HEAD':
        return next();
    }

    data = utils.clone(ctx.result);
    model = utils.getModelFromContext(ctx, app);
    modelNamePlural = utils.pluralForModel(model);
    type = modelNamePlural;

    /**
     * HACK: specifically when data is null and GET :model/:id
     * is being accessed, we should not treat null as ok. It needs
     * to be 404'd and to do that we just exit out of this
     * after remote hook and let the middleware chain continue
     */
    if (!data && ctx.method.name === 'findById') {
      return next();
    }

    var primaryKeyField = utils.primaryKeyForModel(model);
    var regexRelationFromUrl = /\/.*\/(.*$)/g;
    var regexMatches = regexRelationFromUrl.exec(ctx.req.path);
    var relationName = (regexMatches && regexMatches[1]) ? regexMatches[1] : null;

    var relation = model.relations[relationName];
    if (relationName && relation) {
      relatedModelPlural = utils.pluralForModel(relation.modelTo);
      primaryKeyField = utils.primaryKeyForModel(relation.modelTo);

      if (relatedModelPlural) {
        type = relatedModelPlural;
      }
    }

    // If we're sideloading, we need to add the includes
    if (ctx.req.isSideloadingRelationships) {
      requestedIncludes = ctx.req.remotingContext.args.filter.include;
    }
    options = {
      model: model,
      method: ctx.method.name,
      primaryKeyField: primaryKeyField,
      requestedIncludes: requestedIncludes,
      host: utils.hostFromContext(ctx),
      topLevelLinks: {
        self: utils.urlFromContext(ctx)
      },
      dataLinks: {
        self: function (item) {
          var args = [ctx.req.protocol, ctx.req.get('host'), options.restApiRoot];

          if (relatedModelPlural) {
            args.push(relatedModelPlural);
          } else {
            args.push(modelNamePlural);
          }

          args.push(item.id);

          return utils.buildModelUrl.apply(this, args);
        }
      }
    };

    options = _.defaults(options, defaults);
    relations = utils.getRelationsFromContext(ctx, app);

    // Serialize our request
    serializer(type, data, relations, options, function (err, results) {
      if (err) return next(err);

      ctx.result = results;
      next();
    });
  });
};
