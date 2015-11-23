/* global require,module */
'use strict';

var serializer = require('./serializer');
var utils = require('./utils');
var RelUtils = require('./utilities/relationship-utils');
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
      shouldSideloadRelationships,
      relatedModelName,
      relatedModelPlural,
      relations,
      response;

    var matches = regexs.filter(function (regex) {
      return ctx.methodString.match(regex);
    });

    if (!matches.length) {
      return next();
    }

    ctx.res.set({
      'Content-Type': 'application/vnd.api+json'
    });

		// JSON API Spec: If not supported `include` endpoint, throw 400
    if (RelUtils.isRequestingIncludes(ctx.req)) {
      shouldSideloadRelationships = RelUtils.shouldIncludeRelationships(ctx.req.method);

      if (!shouldSideloadRelationships) {
        ctx.res.statusCode = 400;
        return next(RelUtils.getInvalidIncludesError());
      }
    }

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
    response = serializer(type, data, relations, options);

		// If we need to sideload relationships, do it.
    if (shouldSideloadRelationships) {
      handleIncludeRelationships(ctx, next, response, options);
    } else {
      ctx.result = response;
      next();
    }
  });
};

/**
 * Handles requesting the relationships then finalizes the response.
 * @private
 * @memberOf {Serialize}
 * @param {Object} ctx
 * @param {Function} next
 * @param {Object} response
 * @param {Options} options
 * @return {undefined}
 */
function handleIncludeRelationships (ctx, next, response, options) {
  var sideloadRelationships = RelUtils.getIncludesArray(ctx.req.query);
  var relationshipsLeft = sideloadRelationships.length;
  var asyncFinished = true;
  var includedRelationships = [];

  if (!relationshipsLeft) {
    return finalizeIncludesResponse(ctx, next, response, includedRelationships);
  }

  sideloadRelationships.forEach(function (relationship) {
    ctx.result.forEach(function (result) {
      relationshipsLeft--;

      if (result[relationship]) {
        asyncFinished = false;

        result[relationship].getAsync(function (err, res) {
          if (err === null) {
            if (_.isArray(res)) {
              res.forEach(function (inc) {
                inc.type = utils.caserize(relationship, options.keyForRelation);
                includedRelationships.push(inc);
              });
            } else {
              res.type = utils.caserize(relationship, options.keyForRelation);
              includedRelationships.push(res);
            }
          }

          asyncFinished = true;

          if (!relationshipsLeft) {
            return finalizeIncludesResponse(ctx, next, response, includedRelationships);
          }
        });
      }

      if (!relationshipsLeft && asyncFinished) {
        return finalizeIncludesResponse(ctx, next, response, includedRelationships);
      }
    });
  });
}

/**
 * Finalizes the includes response and calls next.
 * @private
 * @memberOf {Serialize}
 * @param {Object} ctx
 * @param {Function} next
 * @param {Object} response
 * @param {Array} includedRelationships
 * @return {undefined}
 */
function finalizeIncludesResponse (ctx, next, response, includedRelationships) {
  response.included = includedRelationships;
  ctx.result = response;
  return next();
}
