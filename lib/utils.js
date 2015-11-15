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

  /** Example
   {
     post: {
       name: 'post',
       type: 'belongsTo',
       modelFrom: [Function: ModelConstructor],
       keyFrom: 'postId',
       modelTo: [Function: ModelConstructor],
       keyTo: 'id',
       polymorphic: undefined,
       modelThrough: undefined,
       keyThrough: undefined,
       multiple: false,
       properties: {},
       options: {},
       scope: undefined,
       embed: false,
       methods: {}
     }
   }
   */
  getRelationsFromContext: function (context, app) {
    var model = this.getModelFromContext(context, app);
    return model.relations;
  },

  getModelFromContext: function (context, app) {
    var name = this.modelNameFromContext(context);
    return app.models[name];
  },

  hostFromContext: function (context) {
    return context.req.protocol + '://' + context.req.get('host');
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
