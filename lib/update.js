var utils = require('./utils');

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {

    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next();
    };

    if (ctx.method.name === 'updateAttributes') {
      // remote links object from resource response
      delete ctx.result.links;
    }

    next();
  });
};
