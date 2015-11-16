'use strict';

var serializer = require('./serializer');
var utils = require('./utils');
var _ = require('lodash');
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

module.exports = function (app, defaults) {
  app.remotes().after('**', function (ctx, next) {
		var data,
			modelName,
			type,
			options,
			relatedModelName,
      relatedModelPlural,
			relations,
			res;

    var matches = regexs.filter(function (regex) {
      return ctx.methodString.match(regex);
    });

    if (!matches.length) {
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
    modelName = utils.modelNameFromContext(ctx);
    type = modelName;

    /**
		 * HACK: specifically when data is null and GET :model/:id
     * is being accessed, we should not treat null as ok. It needs
     * to be 404'd and to do that we just exit out of this
     * after remote hook and let the middleware chain continue
		 */
    if (!data && ctx.method.name === 'findById') {
      return next();
    }

    //match on __GET__, etc.
    if (ctx.methodString.match(/.*\.__.*__.*/)) {
      //get the model name of the related model in plural form.
      //we cant just get the relationship name because the name of
      //the relationship may not match the related model plural.
      //eg. /posts/1/author could actually be a user model so we
      //would want type = 'users'

      //WARNING: feels fragile but functional.
      relatedModelName = ctx.method.returns[0].type;
      relatedModelPlural = utils.pluralForModel(app.models[relatedModelName]);
      if (relatedModelPlural) {
        type = relatedModelPlural;
      }
    }

    options = {
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
						args.push(utils.pluralForModel(app.models[modelName]));
					}

					args.push(item.id);

          return utils.buildModelUrl.apply(this, args);
        }
      }
    };

    options = _.defaults(options, defaults);
    relations = utils.getRelationsFromContext(ctx, app);

		// Serialize our request
    res = serializer(type, data, relations, options);

    ctx.result = res;

    next();
  });
};
