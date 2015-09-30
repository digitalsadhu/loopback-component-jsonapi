var url = require('url');

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {
    if (ctx.method.name === 'updateAttributes') {
      // ctx.res.statusCode = 201;

      delete ctx.result.links;
    }
    next();
  })
}
