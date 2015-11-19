'use strict';
var deserializer = require('./deserializer');
var utils = require('./utils');

module.exports = function (app) {
  /**
   * Register a handler to run before all remote methods so that we can
   * transform JSON API structured JSON payload into something loopback
   * can work with.
   */
  app.remotes().before('**', function (ctx, next) {
    var data, serverRelations, errors;
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
      // set the JSON API Content-Type response header
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});

      /**
       * Check the incoming payload data to ensure it is valid according to the
       * JSON API spec.
       */
      data = ctx.args.data;

      if (!data) {
        return next();
      }

      errors = validateRequest(data, ctx.req.method);
      if (errors) {
        return next(new Error(errors));
      }

      serverRelations = utils.getRelationsFromContext(ctx, app);

      // transform the payload
      ctx.args.data = deserializer(data, serverRelations);

      //TODO: Rewrite to normal search model by type and FK
    }

    next();
  });
};

/**
 * Check for errors in the request. If it has an error it will return a string, otherwise false.
 * @private
 * @memberOf {Deserialize}
 * @param {Object} data
 * @param {String} requestMethod
 * @return {String|false}
 */
function validateRequest(data, requestMethod) {
  if (!data.data) {
    return 'JSON API resource object must contain `data` property';
  }

  if (!data.data.type) {
    return 'JSON API resource object must contain `data.type` property';
  }

  if (['PATCH', 'PUT'].indexOf(requestMethod) > -1 && !data.data.id) {
    return 'JSON API resource object must contain `data.id` property';
  }

  return false;
}
