var utils = require('./utils')

module.exports = function (app, options) {
  var remotes = app.remotes()
  remotes.before('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }
    var query = ctx.req.query
    ctx.args.filter = ctx.args.filter || {}
    if (typeof query.page === 'object') {
      [
        { from: 'offset', to: 'skip' },
        { from: 'limit', to: 'limit' }
      ].forEach(function (p) {
        if (typeof query.page[p.from] === 'string') {
          ctx.args.filter[p.to] = query.page[p.from]
        }
      })
    }
    return next()
  })
}
