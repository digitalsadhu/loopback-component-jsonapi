//copied in its entirity from loopbacks Model class.
//it was necessary to do so as this function is used
//in the other code below
function convertNullToNotFoundError (toModelName, ctx, cb) {
  if (ctx.result !== null) return cb();

  var fk = ctx.getArgByName('fk');
  var msg = 'Unknown "' + toModelName + '" id "' + fk + '".';
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  error.code = 'MODEL_NOT_FOUND';
  cb(error);
}

module.exports = function (app, options) {

  //iterate over all loopback models. This gives us a constructor function
  //and allows us to overwrite the relationship methods:
  // - belongsToRemoting
  // - hasOneRemoting
  // - hasManyRemoting
  // - scopeRemoting
  // - etc
  //
  //Note: This does not seem ideal.
  //We are copying a tonne of code out of loopbacks Model class
  //and then modifying little bits of it below.
  // see: https://github.com/strongloop/loopback/blob/master/lib/model.js#L462-L661
  //Most likely this will be fragile and
  //require us to keep up to date with any chances introduced in loopback.
  //
  //It would be good to have a discussion with the strongloop guys and see
  //if there is a better way this can be done.
  app.models().forEach(function (ctor) {
    console.log(ctor.settings.plural, ctor.modelName);
    if(ctor.modelName === 'test') {
      console.log(ctor.plural);
      ctor.settings.plural = 'test2';
    }
    //sets up remote relationship method belongsTo on any model that
    //has a belongsTo relationship defined in its .json file (or via the
    //node API)
    ctor.belongsToRemoting = function (relationName, relation, define) {
      var modelName = relation.modelTo && relation.modelTo.modelName;
      modelName = modelName || 'PersistedModel';
      var fn = this.prototype[relationName];
      var pathName = (relation.options.http && relation.options.http.path) || relationName;
      define('__get__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/' + pathName},
        accepts: {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
        accessType: 'READ',
        description: 'Fetches belongsTo relation ' + relationName + '.',
        returns: {arg: relationName, type: modelName, root: true}
      }, fn);

      var findBelongsToRelationshipsFunc = function (cb) {
        this['__get__' + pathName](cb);
      };
      define('__findRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/relationships/' + pathName},
        description: 'Find relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: relation.modelTo.modelName, root: true}
      }, findBelongsToRelationshipsFunc);
    };

    ctor.hasOneRemoting = function (relationName, relation, define) {
      var pathName = (relation.options.http && relation.options.http.path) || relationName;
      var toModelName = relation.modelTo.modelName;

      define('__get__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/' + pathName},
        accepts: {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
        description: 'Fetches hasOne relation ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: relationName, type: relation.modelTo.modelName, root: true}
      });

      var findHasOneRelationshipsFunc = function (cb) {
        this['__get__' + pathName](cb);
      };
      define('__findRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/relationships/' + pathName},
        description: 'Find relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true}
      }, findHasOneRelationshipsFunc);
    };

    ctor.hasManyRemoting = function (relationName, relation, define) {
      var pathName = (relation.options.http && relation.options.http.path) || relationName;
      var toModelName = relation.modelTo.modelName;

      var findHasManyRelationshipsFunc = function (cb) {
        this['__get__' + pathName](cb);
      };
      define('__findRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/relationships/' + pathName},
        description: 'Find relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      }, findHasManyRelationshipsFunc);

      var createRelationshipFunc = function (cb) {
        //TODO: implement this
        //this is where we need to implement
        // POST /:model/:id/relationships/:relatedModel
        //
        // this['__get__' + pathName](cb);
      };
      define('__createRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'post', path: '/relationships/' + pathName},
        description: 'Create relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      }, createRelationshipFunc);

      var updateRelationshipsFunc = function (cb) {
        //TODO: implement this
        //this is where we need to implement
        // PATCH /:model/:id/relationships/:relatedModel
        //
        // this['__get__' + pathName](cb);
      };
      define('__updateRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'patch', path: '/relationships/' + pathName},
        description: 'Update relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      }, updateRelationshipsFunc);

      var deleteRelationshipsFunc = function (cb) {
        //TODO: implement this
        //this is where we need to implement
        // DELETE /:model/:id/relationships/:relatedModel
        //
        // this['__get__' + pathName](cb);
      };
      define('__deleteRelationships__' + relationName, {
        isStatic: false,
        http: {verb: 'delete', path: '/relationships/' + pathName},
        description: 'Delete relations for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      }, deleteRelationshipsFunc);

      if (relation.modelThrough || relation.type === 'referencesMany') {
        var modelThrough = relation.modelThrough || relation.modelTo;

        var accepts = [];
        if (relation.type === 'hasMany' && relation.modelThrough) {
          // Restrict: only hasManyThrough relation can have additional properties
          accepts.push({arg: 'data', type: modelThrough.modelName, http: {source: 'body'}});
        }
      }
    };
    ctor.scopeRemoting = function (scopeName, scope, define) {
      var pathName =
        (scope.options && scope.options.http && scope.options.http.path) || scopeName;

      var isStatic = scope.isStatic;
      var toModelName = scope.modelTo.modelName;

      // https://github.com/strongloop/loopback/issues/811
      // Check if the scope is for a hasMany relation
      var relation = this.relations[scopeName];
      if (relation && relation.modelTo) {
        // For a relation with through model, the toModelName should be the one
        // from the target model
        toModelName = relation.modelTo.modelName;
      }

      define('__get__' + scopeName, {
        isStatic: isStatic,
        http: {verb: 'get', path: '/' + pathName},
        accepts: {arg: 'filter', type: 'object'},
        description: 'Queries ' + scopeName + ' of ' + this.modelName + '.',
        accessType: 'READ',
        returns: {arg: scopeName, type: [toModelName], root: true}
      });

    };
  });

  //copied from loopbacks Model class.
  function fixHttpMethod (fn, name) {
    if (fn.http && fn.http.verb && fn.http.verb.toLowerCase() === 'put') fn.http.verb = 'patch';
  }

  //iterate through all remote methods and swap PUTs to PATCHs
  //as PUT is not supported by JSON API.
  app.remotes().methods().forEach(fixHttpMethod);
};
