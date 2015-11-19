var debug;

module.exports = function (app, options) {
  debug = options.debug;
  debug('Registering custom error handler.');

  app.middleware('final', JSONAPIErrorHandler);
};

/**
 * Our JSON API Error handler.
 * @public
 * @memberOf {Errors}
 * @param {Object} err The error object
 * @param {Object} req The request object
 * @param {Object} res The response object
 * @param {Function} next
 * @return {undefined}
 */
function JSONAPIErrorHandler (err, req, res, next) {
  res.set('Content-Type', 'application/vnd.api+json');

  var errors = [];
  var statusCode = err.statusCode || err.status || 500;
  debug('Error thrown:');
  debug('Raw error object:', err);

  if (err.details && err.details.messages) {
    debug('Handling error as a validation error.');

    //This block is for handling validation errors.
    //Build up an array of validation errors.
    errors = Object.keys(err.details.messages).map(function (key) {
      return buildErrorResponse(
        statusCode,
        err.details.messages[key][0],
        err.details.codes[key][0],
        err.name,
        key
      );
    });
  } else if (err.message) {
    debug('Handling error generally. Eg. 404, 500.');
    //this block is for handling other non validation related errors. 404s, 500s etc.

    //convert specific errors below to validation errors.
    //These errors are from checks on the incoming payload to ensure it is
    //JSON API compliant. If we switch to being able to use the Accept header
    //to decide whether to handle the request as JSON API, these errors would
    //need to only be applied when the Accept header is `application/vnd.api+json`
    var additionalValidationErrors = [
      'JSON API resource object must contain `data` property',
      'JSON API resource object must contain `data.type` property',
      'JSON API resource object must contain `data.id` property'
    ];

    if (additionalValidationErrors.indexOf(err.message) !== -1) {
      debug('Recasting error as a validation error.');
      statusCode = 422;
      err.code = 'presence';
      err.name = 'ValidationError';
    }
    errors.push(buildErrorResponse(statusCode, err.message, err.code, err.name));

  } else {
    debug('Unable to determin error type. Treating error as a general 500 server error.');
    //catch all server 500 error if we were unable to understand the error.
    errors.push(buildErrorResponse(500, 'Internal Server error', 'GENERAL_SERVER_ERROR'));
  }

  //generalise the error code. More specific error codes are kept
  //with each error object
  debug('Generalising error status code. Eg. 404 -> 400 for the response');
  statusCode = generalizeStatusCode(statusCode);

  //send the errors and close out the response.
  debug('Sending error response');
  debug('Response Code:', statusCode);
  debug('Response Object:', {errors: errors});
  res.status(statusCode).send({errors: errors}).end();
}

/**
 * Takes a more specific error code and generalises it to 400 or 500.
 * If a generalisation cannot occur, the original code will be returned.
 * @private
 * @memberOf {Errors}
 * @param {number} statusCode
 * @return {number}
 */
function generalizeStatusCode (statusCode) {
  switch (String(statusCode)[0]) {
    case '4':
      return 400;
    case '5':
      return 500;
  }

  return statusCode;
}

/**
 * Builds an error object for sending to the user.
 * @private
 * @memberOf {Errors}
 * @param {Number} httpStatusCode specific http status code
 * @param {String} errorDetail error message for the user, human readable
 * @param {String} errorCode internal system error code
 * @param {String} errorName error title for the user, human readable
 * @param {String} propertyName for validation errors, name of property validation refers to
 * @return {Object}
 */
function buildErrorResponse (httpStatusCode, errorDetail, errorCode, errorName, propertyName) {
  return {
    status: httpStatusCode || 500,
    source: (propertyName) ? { pointer: 'data/attributes/' + propertyName } : '',
    title: errorName || '',
    code: errorCode || '',
    detail: errorDetail || ''
  };
}
