module.exports = function (app, options) {
  var models = app.models

  // use loopbacks standard API to disable all methods that JSON API
  // does not support.

  if (options.hideIrrelevantMethods !== false) {
    options.debug('Disable methods not supported by `jsonapi`. (Set `options.hideIrrelevantMethods = false` to re-enable)')
    Object.keys(models).forEach(function (model) {
      ['upsert', 'exists', 'findOne', 'count', 'createChangeStream', 'updateAll'].forEach(function (method) {
        models[model].disableRemoteMethodByName(method)
      })
    })
    options.debug('`upsert`, `exists`, `findOne`, `count`, `createChangeStream` and `updateAll` disabled for all models')
  }
}
