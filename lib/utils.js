var url = require('url');
var inflection = require('inflection');
var _ = require('lodash');

/**
 * Public API
 */
module.exports = {
  buildModelUrl: buildModelUrl,
  caserize: caserize,
  clone: clone,
  getModelFromContext: getModelFromContext,
  getRelationsFromContext: getRelationsFromContext,
  hostFromContext: hostFromContext,
  modelNameFromContext: modelNameFromContext,
  pluralForModel: pluralForModel,
  urlFromContext: urlFromContext
};

/**
 * Returns the plural for a model.
 * @public
 * @memberOf {Utils}
 * @param {Object} model
 * @return {String}
 */
function pluralForModel (model) {
  if (model.settings && model.settings.http && model.settings.http.path) {
    return model.settings.http.path;
  }

  if (model.settings && model.settings.plural) {
    return model.settings.plural;
  }

  if (model.definition && model.definition.settings && model.definition.settings.plural) {
    return model.definition.settings.plural;
  }

  return inflection.pluralize(model.sharedClass.name);
}

/**
 * Clones an object by stringifying it and parsing it.
 * @public
 * @memberOf {Utils}
 * @param {Object} object
 * @return {Object}
 */
function clone (object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Returns a models name from its context.
 * @public
 * @memberOf {Utils}
 * @param {Object} context
 * @return {String}
 */
function modelNameFromContext (context) {
  return context.method.sharedClass.name;
}

/**
 * Returns the fully qualified host
 * @public
 * @memberOf {Utils}
 * @param {Object} context
 * @return {String}
 */
function hostFromContext (context) {
  return context.req.protocol + '://' + context.req.get('host');
}

/**
 * Returns the fully qualified request url
 * @public
 * @memberOf {Utils}
 * @param {Object} context
 * @return {String}
 */
function urlFromContext (context) {
  return context.req.protocol + '://' + context.req.get('host') + context.req.originalUrl;
}

/**
 * Returns a model from the app object.
 * @public
 * @memberOf {Utils}
 * @param {Object} context
 * @param {Object} app
 * @return {Object}
 */
function getModelFromContext (context, app) {
  var name = modelNameFromContext(context);
  return app.models[name];
}

/**
 * Gets the relations from a context.
 * @public
 * @memberOf {Utils}
 * @param {Object} context
 * @param {Object} app
 * @return {Object}
 *
 * Example
   {
     post: {
       name: 'post',
       type: 'belongsTo',
       modelFrom: [Function: ModelConstructor],
       keyFrom: 'postId',
       modelTo: [Function: ModelConstructor],
       keyTo: 'id',
       polymorphic: undefined,
       modelThrough: undefined,
       keyThrough: undefined,
       multiple: false,
       properties: {},
       options: {},
       scope: undefined,
       embed: false,
       methods: {}
     }
   }
 */
function getRelationsFromContext (context, app) {
  var model = getModelFromContext(context, app);
  return model.relations;
}

/**
 * Builds a models url
 * @public
 * @memberOf {Utils}
 * @param {String} protocol
 * @param {String} host
 * @param {String} apiRoot
 * @param {String} modelName
 * @param {String|Number} id
 * @return {String}
 */
function buildModelUrl (protocol, host, apiRoot, modelName, id) {
  var result;

  try {
    result = url.format({
      protocol: protocol,
      host: host,
      pathname: url.resolve('/', [apiRoot, modelName, id].join('/'))
    });
  } catch (e) {
    return '';
  }

  return result;
}

/**
 * Handles converting string cases.
 * @param {String} value
 * @param {String} type
 * @return {String}
 */
function caserize (value, type) {
  type = type || 'dash-case';

  var mapping = {
    'dash-case': _.kebabCase,
    'underscore_case': inflection.underscore,
    'camelCase': _.camelCase,
    'Classify': inflection.classify
  };

  var func = mapping[type];
  return func(value);
}
