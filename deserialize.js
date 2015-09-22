"use strict";

module.exports = function(app) {
  var remotes = app.remotes();
  
  remotes.before('**', function (ctx, next) {

    if (ctx.req.method === 'POST' || ctx.req.method === 'PATCH') {
      ctx.args.data = ctx.args.data.data.attributes
    }

    next();
  });

  remotes.after('**', function setJSONApiHeader(ctx, next) {
    if (ctx.req.accepts('application/vnd.api+json')) {
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});
    }

    next();
  });
}
