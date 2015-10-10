"use strict";

var Serializer = require('jsonapi-serializer')
var url = require('url')

function serialize(name, data, options) {
  //Workaround as Serializer blows up if data is null
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
  return model.definition.settings.plural
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

function addRelationships(ctx, baseModelName, models, attrs, serializeOptions, options) {
  function includeRelation(key) {
    attrs.push(key)

    //dynamic lookup from plural to model name
    var modelName = modelNameForPlural(models, key)
    var relAttrs = attributesWithoutIdForModel(models[modelName])

    serializeOptions[key] = {
      ref: 'id',
      attributes: relAttrs,
      relationshipLinks: {
        //TODO: implement self relationship link
        // Loopback supports manipulating rels with 'http://localhost:3000/cats/{id}/dogs/rel/{fk}'
        // This doesn't quite work with JSON API as far as I can tell
        // self: function (dataSet, data) {
        //   ...
        // },
        related: function (dataSet, data) {
          return url.format({
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            pathname: options.restApiRoot + '/' + models[baseModelName].definition.settings.plural + '/' + dataSet.id + '/' + key
          })
        }
      },
      includedLinks: {
        self: function (dataSet, data) {
          return url.format({
            protocol: ctx.req.protocol,
            host: ctx.req.get('host'),
            pathname: options.restApiRoot + '/' + key + '/' + data.id
          })
        }
      }
    }
  }

  var filter = filterFromContext(ctx)
  if (filter && filter.include) {
    //filter.include can be an array of strings
    if (Array.isArray(filter.include)) {
      filter.include.forEach(function (key) {
        includeRelation(key)
      })
    } else {
      //otherwise its a string
      includeRelation(filter.include)
    }
    serializeOptions.included = true
  }
}

module.exports = function (app, options) {
  var remotes = app.remotes();

  remotes.after('**', function (ctx, next) {
    ctx.res.set({'Content-Type': 'application/vnd.api+json'});
    var data = ctx.result
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
    // addRelationships(ctx, modelName, app.models, attrs, serializeOptions, options)

    ctx.result = serialize(modelName, clone(data), serializeOptions)
    next()
  })

}
