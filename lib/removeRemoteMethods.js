module.exports = function (app, options) {
  var models = app.models;

  //use loopbacks standard API to disable all methods that JSON API
  //does not support.
  var isStatic = true;

  if (options.hideIrrelevantMethods !== false) {
    Object.keys(models).forEach(function (model) {
      ['upsert', 'exists', 'findOne', 'count', 'createChangeStream', 'updateAll'].forEach(function (method) {
        models[model].disableRemoteMethod(method, isStatic);
      });
    });
  }
};
