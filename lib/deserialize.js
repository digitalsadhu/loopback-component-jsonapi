'use strict';

module.exports = function (app) {
  var remotes = app.remotes();

  //register a handler to run before all remote methods so that we can
  //transform JSON API structured JSON payload into something loopback
  //can work with.
  remotes.before('**', function (ctx, next) {

    //JSON api doesn't support PUT so we only need to apply our changes to
    //POST and PATCH operations.
    if (ctx.req.method === 'POST' || ctx.req.method === 'PATCH') {

      //set the JSON API Content-Type response header
      ctx.res.set({'Content-Type': 'application/vnd.api+json'});

      //check the incoming payload data to ensure it is valid according to the
      //JSON API spec.
      var data = ctx.args.data;
      if (!data.data) return next(new Error('JSON API resource object must contain `data` property'));
      if (!data.data.type) return next(new Error('JSON API resource object must contain `data.type` property'));
      if (ctx.req.method === 'PATCH') {
        if (!data.data.id) return next(new Error('JSON API resource object must contain `data.id` property'));
      }

      //transform the payload
      ctx.args.data = data.data.attributes || {};
    }

    next();
  });
};
