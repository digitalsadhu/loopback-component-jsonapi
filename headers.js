"use strict";

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function setJSONApiHeader(ctx, next) {
    ctx.res.set({'Content-Type': 'application/vnd.api+json'});

    next();
  });
}
