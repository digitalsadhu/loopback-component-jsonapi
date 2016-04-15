module.exports = function (app, options) {
  var models = app.models;

  //use loopbacks standard API to disable all methods that JSON API
  //does not support.
  var isStatic = true;

  if (options.hideIrrelevantMethods !== false) {
    options.debug('Disable methods not supported by `jsonapi`. (Set `options.hideIrrelevantMethods = true` to reenable)');
    Object.keys(models).forEach(function (model) {
      ['upsert', 'exists', 'findOne', 'count', 'createChangeStream', 'updateAll'].forEach(function (method) {
        models[model].disableRemoteMethod(method, isStatic);
      });
    });
    options.debug('`upsert`, `exists`, `findOne`, `count`, `createChangeStream` and `updateAll` disabled for all models');
  }
};
