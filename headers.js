"use strict";

module.exports = function (app, options) {
  var remotes = app.remotes();
  
  remotes.after('**', function setJSONApiHeader(ctx, next) {
    if (ctx.req.accepts('application/vnd.api+json')) {
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});
    }

    next();
  });
}
