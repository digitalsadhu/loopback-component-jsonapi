var _ = require('lodash');
var inflection = require('inflection');

module.exports = function (app, options) {
  //get remote methods.
  //set strong-remoting for more information
  //https://github.com/strongloop/strong-remoting
  var remotes = app.remotes();

  remotes.before('**', function (ctx, next) {

    var id = ctx.req.params.id;
    var data = ctx.args.data;

    relationships(id, data, app);

    next();
  });

  // for create
  remotes.after('**', function (ctx, next) {

    if (ctx.result) {
      var id = ctx.result.id;
      var data = ctx.req.body;

      relationships(id, data, app);
    };

    next();
  });

};

function relationships (id, data, app) {

  if (!data || !data.data || !data.data.type || !id) {
    return;
  }

  var modelName = inflection.classify(data.data.type);

  var model = app.models[modelName];
  if (!model || !data.relationships) {
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
        createOrUpdateRelation(modelTo, item.id, where);
      });
    } else {
      // relationship: {data: {type: "comments": id: 1}}
      createOrUpdateRelation(modelTo, relationship.data.id, where);
    }

  });

  return;
}

// if the instance exist, then update it (create relationship),
// if not, then create one with the relation to the model
function createOrUpdateRelation (model, id, data) {
  model.findById(id, function (err, instance) {
    if (err) {console.log(err);}
    // instance does not exists yet, let's creat it
    if (instance === null || instance === undefined) {
      model.create(data);
    } else {
      instance.updateAttributes(data);
    }
  });
}
