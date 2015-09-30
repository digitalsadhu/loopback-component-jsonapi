module.exports = function (app, options) {
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
