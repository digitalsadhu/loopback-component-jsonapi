module.exports = function (app, options) {
  //intercept rest api errors not caught in remotes().afterError()
  app.settings.remoting = app.settings.remoting || {}
  app.settings.remoting.errorHandler = app.settings.remoting.errorHandler || {}
  app.settings.remoting.errorHandler.handler = function JSONAPIErrorHandler(err, req, res, next) {
    res.set('Content-Type', 'application/vnd.api+json');
    res.status(err.status).send({
      errors: [{
        status: err.status,
        detail: err.message
      }]
    });
    res.end();
  };

  //catch even more errors that aren't handled by the rest error handler or by the remotes().afterError()
  //handler
  app.middleware('final', function (err, req, res, next) {
    res.set('Content-Type', 'application/vnd.api+json');
    res.status(err.status).send({
      errors: [{
        status: err.status,
        detail: err.message
      }]
    });
    res.end();
  });

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
        }
      });
      statusCode = ctx.error.statusCode;
    }

    else if (ctx.error.message) {
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
    }

    else {
      errors.push({
        status: 500,
        detail: 'Internal server error'
      });
    }

    ctx.res.status(statusCode).send({errors: errors});
    ctx.res.end();
  });
}
