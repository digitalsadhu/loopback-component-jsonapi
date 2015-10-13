module.exports = function (app, options) {
  //turn off strong remoting rest error handler so that we can catch all errors
  //here
  //TODO: need to wait until PR is accepted
  //https://github.com/strongloop/strong-remoting/pull/248
  //then uncomment the following line:
  // app.remotes().options.rest.handleErrors = false;
  //after that it will be possible to delete both the afterError handler and
  //the app.settings.remoting.errorHandler and handle all errors in
  //the app.middleware('final'... block below.

  //intercept rest api errors not caught in remotes().afterError()
  app.settings.remoting = app.settings.remoting || {};
  app.settings.remoting.errorHandler = app.settings.remoting.errorHandler || {};
  function JSONAPIErrorHandler (err, req, res, next) {
    res.set('Content-Type', 'application/vnd.api+json');
    var status = err.status || err.statusCode || 500;

    res.status(status).send({
      errors: [{
        status: status,
        detail: err.message
      }]
    });
    res.end();
  };
  app.settings.remoting.errorHandler.handler = JSONAPIErrorHandler;

  //catch even more errors that aren't handled by the rest error handler or by the remotes().afterError()
  //handler
  app.middleware('final', JSONAPIErrorHandler);

  var remotes = app.remotes();
  remotes.afterError('**', function (ctx, next) {
    var errors = [];
    var statusCode = 500;

    //validation errors
    if (ctx.error.details && ctx.error.details.messages) {
      errors = Object.keys(ctx.error.details.messages).map(function (key) {
        return {
          status: ctx.error.statusCode,
          source: { pointer: 'data/attributes/' + key },
          title: ctx.error.name,
          code: ctx.error.details.codes[key][0],
          detail: ctx.error.details.messages[key][0]
        };
      });
      statusCode = ctx.error.statusCode;
    } else if (ctx.error.message) {
      statusCode = ctx.error.statusCode || ctx.error.status || 500;

      if (ctx.error.message === 'JSON API resource object must contain `data` property') {
        statusCode = 422;
      }

      if (ctx.error.message === 'JSON API resource object must contain `data.type` property') {
        statusCode = 422;
      }

      if (ctx.error.message === 'JSON API resource object must contain `data.id` property') {
        statusCode = 422;
      }

      errors.push({
        status: statusCode,
        detail: ctx.error.message
      });
    } else {
      errors.push({
        status: 500,
        detail: 'Internal server error'
      });
    }

    ctx.res.status(statusCode).send({errors: errors});
    ctx.res.end();
  });
};
