"use strict";

var Serializer = require('jsonapi-serializer')
var url = require('url')

function serialize(name, data, options) {
  //Workaround as Serializer blows up if data is null.
  //TODO: submit issue to serializer library to get this
  //cleaned up
  var dataIsNull = !data;
  if (dataIsNull) {
    data = []
  }
  var result = new Serializer(name, data, options);
  if (dataIsNull) {
    result.data = null;
  }
  return result;
}

function pluralForModel(model) {
  //this only works where the plural is explicitly set.
  //TODO: fall back to automatic pluralization when
  //model.definition.settings.plural is undefined
  return model.definition.settings.plural;
}

function modelNameForPlural(models, plural) {
  return Object.keys(models).filter(function (name) {
    if (models[name] && models[name].definition) {
      return models[name].definition.settings.plural === plural
    }
    return false
  })[0]
}

function modelForPlural(models, plural) {
  return models[modelNameForPlural(models, plural)]
}

function attributesForModel(model) {
  return Object.keys(model.definition.properties)
}

function attributesWithoutIdForModel(model) {
  var attrs = attributesForModel(model)
  attrs.splice(attrs.indexOf('id'), 1)
  return attrs
}

function clone(object) {
  return JSON.parse(JSON.stringify(object))
}

function filterFromContext(context) {
  try {
    return JSON.parse(context.args.filter)
  } catch (e) {
    return false
  }
}

function modelNameFromContext(context) {
  return context.method.sharedClass.name
}

function urlFromContext(context) {
  return context.req.protocol + '://' + context.req.get('host') + context.req.originalUrl
}

function primaryKeyFromModel(model) {
  console.log(model.definition.properties)
}

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {
    ctx.res.set({'Content-Type': 'application/vnd.api+json'});
    var data = ctx.result

    //housekeeping, just skip verbs we definitely aren't
    //interested in handling.
    if (ctx.req.method === 'DELETE') return next();
    if (ctx.req.method === 'PUT') return next();
    if (ctx.req.method === 'HEAD') return next();

    var modelName = modelNameFromContext(ctx)

    //HACK: specifically when data is null and GET :model/:id
    //is being accessed, we should not treat null as ok. It needs
    //to be 404'd and to do that we just exit out of this
    //after remote hook and let the middleware chain continue
    if (data === null && ctx.method.name === 'findById') {
      return next();
    }

    var attrs = attributesWithoutIdForModel(app.models[modelName])

    var serializeOptions = {
      id: 'id',
      attributes: attrs,
      topLevelLinks: { self: urlFromContext(ctx) },
      dataLinks: {
        self: function (item) {
          return ctx.req.protocol + '://' + ctx.req.get('host') + ctx.req.baseUrl + '/' + item.id
        }
      }
    }

    //append `related` links key if applicable
    //creates /:model/:id/:model from /:model/:id/relationships/:model
    if (serializeOptions.topLevelLinks.self.match(/\/relationships\//)) {
      serializeOptions.topLevelLinks.related = serializeOptions.topLevelLinks.self.replace('/relationships/', '/');
    }

    var type = modelName;
    //match on __GET__, etc.
    if (ctx.methodString.match(/.*\.__.*__.*/)) {
      //get the model name of the related model in plural form.
      //we cant just get the relationship name because the name of
      //the relationship may not match the related model plural.
      //eg. /posts/1/author could actually be a user model so we
      //would want type = 'users'

      //WARNING: feels fragile but functional.
      var relatedModelName = ctx.method.returns[0].type;
      var relatedModelPlural = pluralForModel(app.models[relatedModelName])
      if (relatedModelPlural) {
        type = relatedModelPlural
      }
    }

    ctx.result = serialize(type, clone(data), serializeOptions)
    next()
  })

}
