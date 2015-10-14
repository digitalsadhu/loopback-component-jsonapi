module.exports = function (app, options) {
  var models = app.models;

  //use loopbacks standard API to disable all methods that JSON API
  //does not support.
  var isStatic = true;
  Object.keys(models).forEach(function (model) {
    models[model].disableRemoteMethod('upsert', isStatic);
    models[model].disableRemoteMethod('exists', isStatic);
    models[model].disableRemoteMethod('findOne', isStatic);
    models[model].disableRemoteMethod('count', isStatic);
    models[model].disableRemoteMethod('createChangeStream', isStatic);
    models[model].disableRemoteMethod('updateAll', isStatic);
  });
};
