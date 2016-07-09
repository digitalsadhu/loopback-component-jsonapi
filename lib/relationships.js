'use strict'

var _ = require('lodash')
var utils = require('./utils')

module.exports = function (app, options) {
  // get remote methods.
  // set strong-remoting for more information
  // https://github.com/strongloop/strong-remoting
  var remotes = app.remotes()
  var id, data, model

  remotes.before('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    var allowedMethodNames = ['updateAttributes', 'patchAttributes']
    var methodName = ctx.method.name
    if (allowedMethodNames.indexOf(methodName) === -1) return next()

    id = ctx.req.params.id
    data = options.data
    model = utils.getModelFromContext(ctx, app)

    relationships(id, data, model)

    next()
  })

  // for create
  remotes.after('**', function (ctx, next) {
    if (utils.shouldNotApplyJsonApi(ctx, options)) {
      return next()
    }

    if (ctx.method.name !== 'create') return next()

    if (ctx.result && ctx.result.data) {
      id = ctx.result.data.id
      data = options.data
      model = utils.getModelFromContext(ctx, app)
      relationships(id, data, model)
    }

    next()
  })
}

function relationships (id, data, model) {
  if (!data || !data.data || !id || !model || !data.data.relationships) {
    return
  }

  _.each(data.data.relationships, function (relationship, name) {
    var serverRelation = model.relations[name]
    if (!serverRelation) return
    var type = serverRelation.type

    // don't handle belongsTo in relationships function
    if (type === 'belongsTo') return

    var modelTo = serverRelation.modelTo

    var fkName = serverRelation.keyTo

    if (type === 'belongsTo') {
      fkName = serverRelation.keyFrom
      modelTo = serverRelation.modelFrom
    }

    if (!modelTo) {
      return false
    }

    var setTo = {}
    setTo[fkName] = null
    var where = {}
    where[fkName] = id

    // remove all relations to the model (eg .: post/1)
    if (type !== 'belongsTo') {
      modelTo.updateAll(where, setTo, function (err, info) {
        if (err) console.log(err)
      })
    }

    var idToFind = null

    if (_.isArray(relationship.data)) {
      // find all instance from the relation data eg
      // [{type: "comments", id: 1}, {type: "comments", id: 2}]
      _.each(relationship.data, function (item) {
        idToFind = item.id

        if (type === 'belongsTo') {
          where[fkName] = item.id
          idToFind = id
        }

        updateRelation(modelTo, idToFind, where)
      })

      if (serverRelation.modelThrough) {
        var modelThrough = serverRelation.modelThrough
        var key = keyByModel(modelThrough, modelTo)
        var data = {}
        data[fkName] = id

        var payloadIds = _.map(relationship.data, function(item) {
          return item.id
        })

        modelThrough.find({where: data}, function(err, instances) {
          var serverIds = _.map(instances, function(instance) {
            return instance[key]
          })
          // to delete
          var toDelete = _.difference(serverIds, payloadIds);
          _.each(toDelete, function(id) {
            data[key] = id
            modelThrough.destroyAll(data)
          })
          // new
          var newAssocs = _.difference(payloadIds, serverIds);
          _.each(newAssocs, function(id) {
            data[key] = id
            modelThrough.create(data)
          })          
        })

      }

    } else {
      if (relationship.data === null) {
        where[fkName] = null
        updateRelation(model, id, where)
        return
      }

      idToFind = relationship.data.id

      if (type === 'belongsTo') {
        idToFind = id
        where[fkName] = relationship.data.id
      }
      // relationship: {data: {type: "comments": id: 1}}
      updateRelation(modelTo, idToFind, where)
    }
  })

  return
}

// if the instance exist, then update it (create relationship),
// according to JSON API spec we MUST NOT create new ones
function updateRelation (model, id, data) {
  model.findById(id, function (err, instance) {
    if (err) console.log(err)

    if (instance) {
      instance.updateAttributes(data)
    }
  })
}

function keyByModel(assocModel, model) {
  var key = null;
  _.each(assocModel.relations, function(relation){
    if (relation.modelTo.modelName === model.modelName) {
      key = relation.keyFrom;
    }
  })
  
  if (key === null) {
    console.log('Can not find relation for ' + model.modelName);
  }
  return key
}
