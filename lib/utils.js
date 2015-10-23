var url = require('url');
var inflection = require('inflection');

module.exports = {

  pluralForModel: function (model) {
    if (model.settings && model.settings.http && model.settings.http.path) {
      return model.settings.http.path;
    }

    if (model.settings && model.settings.plural) {
      return model.settings.plural;
    }

    if (model.definition && model.definition.settings && model.definition.settings.plural) {
      return model.definition.settings.plural;
    }

    return inflection.pluralize(model.sharedClass.name);
  },

  clone: function (object) {
    return JSON.parse(JSON.stringify(object));
  },

  modelNameFromContext: function (context) {
    return context.method.sharedClass.name;
  },

  urlFromContext: function (context) {
    return context.req.protocol + '://' + context.req.get('host') + context.req.originalUrl;
  },

  buildModelUrl: function (protocol, host, apiRoot, modelName, id) {
    var result;
    try {
      result = url.format({
        protocol: protocol,
        host: host,
        pathname: url.resolve('/', [apiRoot, modelName, id].join('/'))
      });
    } catch (e) {
      return '';
    }
    return result;
  }
};
