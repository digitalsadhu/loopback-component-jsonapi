'use strict';

var _ = require('lodash');
var utils = require('./utils');

module.exports = function (app, options) {
  //get remote methods.
  //set strong-remoting for more information
  //https://github.com/strongloop/strong-remoting
  var remotes = app.remotes();
  var id, data, model;

  remotes.before('**', function (ctx, next) {

    id = ctx.req.params.id;
    data = ctx.args.data;
    model = utils.getModelFromContext(ctx, app);
    relationships(id, data, model);

    next();
  });

  // for create
  remotes.after('**', function (ctx, next) {

    if (ctx.result) {
      id = ctx.result.id;
      data = ctx.req.body;
      model = utils.getModelFromContext(ctx, app);
      relationships(id, data, model);
    };

    next();
  });

};

function relationships (id, data, model) {

  if (!data || !data.data || !id || !model || !data.relationships) {
    return;
  }

  _.each(data.relationships, function (relationship, name) {

    var serverRelation = model.relations[name];
    var modelTo = serverRelation.modelTo;
    if (!modelTo) {
      return false;
    }
    var fk = serverRelation.keyTo;

    var setTo = {};
    setTo[fk] = null;
    var where = {};
    where[fk] = id;

    // remove all relations to the model (eg .: post/1)
    modelTo.updateAll(where, setTo, function (err, info) {
      if (err) {console.log(err);}
    });

    if (_.isArray(relationship.data)) {
      // find all instance from the relation data eg
      // [{type: "comments", id: 1}, {type: "comments", id: 2}]
      _.each(relationship.data, function (item) {
        updateRelation(modelTo, item.id, where);
      });
    } else {
      // relationship: {data: {type: "comments": id: 1}}
      updateRelation(modelTo, relationship.data.id, where);
    }

  });

  return;
}

// if the instance exist, then update it (create relationship),
// according to JSON API spec we MUST NOT create new ones
function updateRelation (model, id, data) {
  model.findById(id, function (err, instance) {
    if (err) {console.log(err);}

    if (instance !== null) {
      instance.updateAttributes(data);
    }

  });
}
