var _ = require('lodash');

/* global module */
module.exports = {
  getIncludesArray: getIncludesArray,
  getInvalidIncludesError: getInvalidIncludesError,
  isRequestingIncludes: isRequestingIncludes,
  shouldIncludeRelationships: shouldIncludeRelationships
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
  error.statusCode = 400;
  error.code = 400;

  return error;
}

/**
 * Is the user requesting to sideload relationships?>
 * @public
 * @MemberOf {RelationshipUtils}
 * @return {Boolean}
 */
function isRequestingIncludes (req) {
  return _.isPlainObject(req.query) && req.query.hasOwnProperty('include') && req.query.include.length > 0;
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
