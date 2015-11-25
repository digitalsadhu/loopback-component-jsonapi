var url = require('url');

module.exports = function (app, options) {
  //get remote methods.
  //set strong-remoting for more information
  //https://github.com/strongloop/strong-remoting
  var remotes = app.remotes();

  //register after remote method hook on all methods
  remotes.after('**', function (ctx, next) {

    //in this case we are only interested in handling create operations.
    if (ctx.method.name === 'create') {
      //JSON API specifies that created resources should have the
      //http status code of 201
      ctx.res.statusCode = 201;

      //build the location url for the created resource.
      var location = url.format({
        protocol: ctx.req.protocol,
        host: ctx.req.get('host'),
        pathname: ctx.req.baseUrl + '/' + ctx.result.data.id
      });

      //we don't need the links property so just delete it.
      delete ctx.result.links;

      //JSON API specifies that when creating a resource, there should be a
      //location header set with the url of the created resource as the value
      ctx.res.append('Location', location);
    }
    next();
  });
};
