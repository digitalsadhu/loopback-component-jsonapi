var _ = require('lodash');
var statusCodes = require('http-status-codes');

/* global module */
module.exports = {
  getIncludesArray: getIncludesArray,
  getInvalidIncludesError: getInvalidIncludesError,
  isRequestingIncludes: isRequestingIncludes,
  shouldIncludeRelationships: shouldIncludeRelationships,
  isLoopbackInclude: isLoopbackInclude,
  getPagination: getPagination,
  isJSONAPIPagination: isJSONAPIPagination
};

/**
 * Get the invalid includes error.
 * @public
 * @memberOf {RelationshipUtils}
 * @param {String} message
 * @return {Error}
 */
function getInvalidIncludesError (message) {
  var error = new Error(message || 'JSON API resource does not support `include`');
  error.statusCode = statusCodes.BAD_REQUEST;
  error.code = statusCodes.BAD_REQUEST;
  error.status = statusCodes.BAD_REQUEST;

  return error;
}

function isLoopbackInclude (ctx) {
  return ctx.args && ctx.args.filter;
}

function isJSONAPIInclude (req) {
  return _.isPlainObject(req.query) && req.query.hasOwnProperty('include') && req.query.include.length > 0;
}

/**
 * Is the user requesting to sideload relationships?>
 * @public
 * @MemberOf {RelationshipUtils}
 * @return {Boolean}
 */
function isRequestingIncludes (ctx) {
  return isLoopbackInclude(ctx) || isJSONAPIInclude(ctx.req);
}

/**
 * Returns an array of relationships to include. Per JSON specification, they will
 * be in a comma-separated pattern.
 * @public
 * @memberOf {RelationshipUtils}
 * @param {Object} query
 * @return {Array}
 */
function getIncludesArray (query) {
  var relationships = query.include.split(',');

  return relationships.map(function (val) {
    return val.trim();
  });
}

/**
 * We should only include relationships if they are using GET
 * @public
 * @memberOf {RelationshipUtils}
 * @return {Boolean}
 */
function shouldIncludeRelationships (method) {
  return method.toLowerCase() === 'get';
}

function isJSONAPIPagination (req) {
  return _.isPlainObject(req.query) && req.query.hasOwnProperty('page') &&
    req.query['page'].hasOwnProperty('size');
}
/**
 * Get the pagination data from query parameters
 */
function getPagination (query) {
    return {
        limit : query.page.size,
        skip : Math.max(query.page.number - 1, 0) * query.page.size
    };
}