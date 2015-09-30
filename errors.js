module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.afterError('**', function (ctx, next) {
    var errors = Object.keys(ctx.error.details.messages).map(function (key) {
      return {
        status: ctx.error.statusCode,
        source: { pointer: 'data/attributes/' + key },
        title: ctx.error.name,
        code: ctx.error.details.codes[key][0],
        detail: ctx.error.details.messages[key][0]
      }
    })

    ctx.res.status(ctx.error.statusCode).send({errors: errors});
    ctx.res.end();
  });
}
