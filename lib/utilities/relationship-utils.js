var _ = require('lodash');

/* global module */
module.exports = {
	getInvalidIncludesError: getInvalidIncludesError,
	isRequestingIncludes: isRequestingIncludes,
	shouldIncludeRelationships: shouldIncludeRelationships
};

/**
 * Get the invalid includes error.
 * @public
 * @memberOf {RelationshipUtils}
 * @return {Error}
 */
function getInvalidIncludesError(method) {
	var error = new Error('JSON API resource does not support `include`');
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
 * We should only include relationships if they are using GET
 * @public
 * @memberOf {RelationshipUtils}
 * @return {Boolean}
 */
function shouldIncludeRelationships(method) {
	return method.toLowerCase() === 'get';
}
