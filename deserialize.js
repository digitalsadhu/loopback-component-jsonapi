"use strict";

module.exports = function(app) {
  var remotes = app.remotes();

  remotes.before('**', function (ctx, next) {
    if (ctx.req.method === 'POST' || ctx.req.method === 'PATCH') {
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});
      var data = ctx.args.data
      if (!data.data) return next(new Error('JSON API resource object must contain `data` property'))
      if (!data.data.type) return next(new Error('JSON API resource object must contain `data.type` property'))

      if (ctx.req.method === 'PATCH') {
        if (!data.data.id) return next(new Error('JSON API resource object must contain `data.id` property'))
      }

      ctx.args.data = data.data.attributes || {}
    }

    next();
  });
}
