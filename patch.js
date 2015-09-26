function convertNullToNotFoundError(toModelName, ctx, cb) {
  if (ctx.result !== null) return cb();

  var fk = ctx.getArgByName('fk');
  var msg = 'Unknown "' + toModelName + '" id "' + fk + '".';
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  error.code = 'MODEL_NOT_FOUND';
  cb(error);
}

function fixHttpMethod(fn, name) {
  if (fn.http && fn.http.verb && fn.http.verb.toLowerCase() === 'put') fn.http.verb = 'patch';
}

module.exports = function (app, options) {
  app.models().forEach(function(ctor) {
    ctor.hasOneRemoting = function(relationName, relation, define) {
      var pathName = (relation.options.http && relation.options.http.path) || relationName;
      var toModelName = relation.modelTo.modelName;

      define('__get__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/' + pathName},
        accepts: {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
        description: 'Fetches hasOne relation ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: relationName, type: relation.modelTo.modelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      });

      define('__create__' + relationName, {
        isStatic: false,
        http: {verb: 'post', path: '/' + pathName},
        accepts: {arg: 'data', type: toModelName, http: {source: 'body'}},
        description: 'Creates a new instance in ' + relationName + ' of this model.',
        accessType: 'WRITE',
        returns: {arg: 'data', type: toModelName, root: true}
      });

      define('__update__' + relationName, {
        isStatic: false,
        http: {verb: 'patch', path: '/' + pathName},
        accepts: {arg: 'data', type: toModelName, http: {source: 'body'}},
        description: 'Update ' + relationName + ' of this model.',
        accessType: 'WRITE',
        returns: {arg: 'data', type: toModelName, root: true}
      });

      define('__destroy__' + relationName, {
        isStatic: false,
        http: {verb: 'delete', path: '/' + pathName},
        description: 'Deletes ' + relationName + ' of this model.',
        accessType: 'WRITE'
      });
    };

    ctor.hasManyRemoting = function(relationName, relation, define) {
      var pathName = (relation.options.http && relation.options.http.path) || relationName;
      var toModelName = relation.modelTo.modelName;

      var findByIdFunc = this.prototype['__findById__' + relationName];
      define('__findById__' + relationName, {
        isStatic: false,
        http: {verb: 'get', path: '/' + pathName + '/:fk'},
        accepts: {arg: 'fk', type: 'any',
          description: 'Foreign key for ' + relationName, required: true,
          http: {source: 'path'}},
        description: 'Find a related item by id for ' + relationName + '.',
        accessType: 'READ',
        returns: {arg: 'result', type: toModelName, root: true},
        rest: {after: convertNullToNotFoundError.bind(null, toModelName)}
      }, findByIdFunc);

      var destroyByIdFunc = this.prototype['__destroyById__' + relationName];
      define('__destroyById__' + relationName, {
        isStatic: false,
        http: {verb: 'delete', path: '/' + pathName + '/:fk'},
        accepts: {arg: 'fk', type: 'any',
          description: 'Foreign key for ' + relationName, required: true,
          http: {source: 'path'}},
        description: 'Delete a related item by id for ' + relationName + '.',
        accessType: 'WRITE',
        returns: []
      }, destroyByIdFunc);

      var updateByIdFunc = this.prototype['__updateById__' + relationName];
      define('__updateById__' + relationName, {
        isStatic: false,
        http: {verb: 'patch', path: '/' + pathName + '/:fk'},
        accepts: [
          {arg: 'fk', type: 'any',
            description: 'Foreign key for ' + relationName, required: true,
            http: {source: 'path'}},
          {arg: 'data', type: toModelName, http: {source: 'body'}}
        ],
        description: 'Update a related item by id for ' + relationName + '.',
        accessType: 'WRITE',
        returns: {arg: 'result', type: toModelName, root: true}
      }, updateByIdFunc);

      if (relation.modelThrough || relation.type === 'referencesMany') {
        var modelThrough = relation.modelThrough || relation.modelTo;

        var accepts = [];
        if (relation.type === 'hasMany' && relation.modelThrough) {
          // Restrict: only hasManyThrough relation can have additional properties
          accepts.push({arg: 'data', type: modelThrough.modelName, http: {source: 'body'}});
        }

        var addFunc = this.prototype['__link__' + relationName];
        define('__link__' + relationName, {
          isStatic: false,
          http: {verb: 'patch', path: '/' + pathName + '/rel/:fk'},
          accepts: [{arg: 'fk', type: 'any',
            description: 'Foreign key for ' + relationName, required: true,
            http: {source: 'path'}}].concat(accepts),
          description: 'Add a related item by id for ' + relationName + '.',
          accessType: 'WRITE',
          returns: {arg: relationName, type: modelThrough.modelName, root: true}
        }, addFunc);

        var removeFunc = this.prototype['__unlink__' + relationName];
        define('__unlink__' + relationName, {
          isStatic: false,
          http: {verb: 'delete', path: '/' + pathName + '/rel/:fk'},
          accepts: {arg: 'fk', type: 'any',
            description: 'Foreign key for ' + relationName, required: true,
            http: {source: 'path'}},
          description: 'Remove the ' + relationName + ' relation to an item by id.',
          accessType: 'WRITE',
          returns: []
        }, removeFunc);

        // FIXME: [rfeng] How to map a function with callback(err, true|false) to HEAD?
        // true --> 200 and false --> 404?
        var existsFunc = this.prototype['__exists__' + relationName];
        define('__exists__' + relationName, {
          isStatic: false,
          http: {verb: 'head', path: '/' + pathName + '/rel/:fk'},
          accepts: {arg: 'fk', type: 'any',
            description: 'Foreign key for ' + relationName, required: true,
            http: {source: 'path'}},
          description: 'Check the existence of ' + relationName + ' relation to an item by id.',
          accessType: 'READ',
          returns: {arg: 'exists', type: 'boolean', root: true},
          rest: {
            // After hook to map exists to 200/404 for HEAD
            after: function(ctx, cb) {
              if (ctx.result === false) {
                var modelName = ctx.method.sharedClass.name;
                var id = ctx.getArgByName('id');
                var msg = 'Unknown "' + modelName + '" id "' + id + '".';
                var error = new Error(msg);
                error.statusCode = error.status = 404;
                error.code = 'MODEL_NOT_FOUND';
                cb(error);
              } else {
                cb();
              }
            }
          }
        }, existsFunc);
      }
    };
  });

  app.remotes().methods().forEach(fixHttpMethod);
}
