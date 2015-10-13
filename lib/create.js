var url = require('url');

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {
    if (ctx.method.name === 'create') {
      ctx.res.statusCode = 201;

      var location = url.format({
        protocol: ctx.req.protocol,
        host: ctx.req.get('host'),
        pathname: ctx.req.baseUrl + '/' + ctx.result.data.id
      });

      delete ctx.result.links;
      ctx.res.append('Location', location);
    }
    next();
  });
};
