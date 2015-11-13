module.exports = function (app, options) {
  //get remote methods.
  //set strong-remoting for more information
  //https://github.com/strongloop/strong-remoting
  var remotes = app.remotes();

  //register after remote method hook on all methods
  remotes.after('**', function (ctx, next) {

    //in this case we are only interested in handling create operations.
    if (ctx.method.name === 'deleteById') {
      //JSON API specifies that successful
      //deletes with no content returned should be 204
      if (ctx.res.statusCode === 200) {
        ctx.res.status(204);
      }
    }
    next();
  });
};
