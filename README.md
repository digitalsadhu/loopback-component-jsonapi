# loopback-component-jsonapi

[![Greenkeeper badge](https://badges.greenkeeper.io/digitalsadhu/loopback-component-jsonapi.svg)](https://greenkeeper.io/)

[![Join the chat at https://gitter.im/digitalsadhu/loopback-component-jsonapi](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/digitalsadhu/loopback-component-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi.svg)](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi)
[![npm version](https://badge.fury.io/js/loopback-component-jsonapi.svg)](http://badge.fury.io/js/loopback-component-jsonapi)
[![Dependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi)
[![devDependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi/dev-status.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/digitalsadhu/loopback-component-jsonapi/badge.svg?branch=master)](https://coveralls.io/github/digitalsadhu/loopback-component-jsonapi?branch=master)

[jsonapi.org](http://jsonapi.org/) support for loopback.

## Status

This project is now pretty stable and is used in production in a number of our projects.
There are known issues (see below and the issue tracker) these can mostly be worked around or
are pretty minor. Open an issue on the issue tracker if you need clarification on anything or
need help.

### Known issues

This module doesn't do complex compound documents very well yet. This means that if you try to do complex
includes in a single request you will likely run into trouble.

We wrote another module called [loopback-jsonapi-model-serializer](https://www.npmjs.com/package/loopback-jsonapi-model-serializer)
that does JSONAPI serialization very well (but nothing else) for loopback which you can use to get
around such issues for now. The long term goal is to swap out the serialization layer in
`loopback-component-jsonapi` with `loopback-jsonapi-model-serializer`

## Tested against:

- Node 4, 6 and 8
- JSON API v1.0
- loopback ^3.8.0

## Sample Project
We have created a sample project using [EmberJS](http://emberjs.com), [Loopback](http://loopback.io) and this compoment. It's called [emberloop](https://github.com/tsteuwer/emberloop).

## Helping out
We are VERY interested in help. Get in touch via the [issue tracker](https://github.com/digitalsadhu/loopback-component-jsonapi/issues)
Please read the following about contributing:

### Semantic Release

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) to manage the release process.
This means that:
A. There is no semver project version in `package.json`. This is managed in CI.
B. Commit messages need to follow conventions. See [here](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit) for commit message guidelines.
The important things to remember are:
A. If you are fixing a bug prefix your commit message with `fix(<thing being fixed goes here>):`
B. If you are adding a non breaking feature, prefix your commit with `feat(<name of feature goes here>):`
C. If you are making a breaking change of any kind, prefix additional information on the 3rd line of the commit message with: `BREAKING CHANGE:`
See examples of this on the [Semantic Release](https://github.com/semantic-release/semantic-release) github pages.
And don't hesitate to reach out on our [issue tracker](https://github.com/digitalsadhu/loopback-component-jsonapi/issues)
if you want further clarification.

### Standard js and "prettier standard"

This project is follows the [Standard js](https://standardjs.com/) styleguide. Linting happens on CI and any time you run tests via `npm test`
You can run the linting on its own with `npm run lint`

Additionally, code formatting is done whenever you run git commit. This is made possibly by [lint-staged](https://github.com/okonet/lint-staged) and [husky](https://github.com/typicode/husky) with actual formatting done by
[prettier](https://github.com/prettier/prettier)

### Pull requests and code review

All code is reviewed by one or more of the project maintainers before merging. Before becoming a maintainer, contributers
need to fork the master branch of this repo, make their changes and submit a pull request.

Once a contributor becomes a maintainer, it is preferred that they create new branches on the loopback-component-jsonapi
repo and submit those as pull requests

### Tests

We take testing seriously. The project contains over 200 tests at time of writing this. In most cases we wont merge
anything without tests. (Within reason of course)

### Project maintainers

We follow the principle of "Open open source" which means if you contribute even a single PR to the project, we make you
a project maintainer.

## Debugging
You can enable debug logging by setting an environment variable:
`DEBUG=loopback-component-jsonapi`

#### example:
```
DEBUG=loopback-component-jsonapi node .
```

# API Documentation

## Getting started

In your loopback project:

1. `npm install --save loopback-component-jsonapi`
2. Create a `component-config.json` file in your server folder (if you don't already have one)
3. Add the following config to `component-config.json`

```json
{
  "loopback-component-jsonapi": {}
}
```

## Advanced usage:
We are aiming to make the component as configurable as possible. You can configure how the component behaves with the options shown and listed below. If there is something else you would like to see be configurable, please submit an issue on the repository. For remote methods, `root` must be set to `true`.

Example:
(all configuration options listed)
```json
{
  "loopback-component-jsonapi": {
    "restApiRoot": "/api",
    "host": "https://www.mydomain.com",
    "enable": true,
    "handleErrors": true,
    "errorStackInResponse": false,
    "handleCustomRemoteMethods": false,
    "exclude": [
      {"model": "comment"},
      {"methods": "find"},
      {"model": "post", "methods": "find"},
      {"model": "person", "methods": ["find", "create"]}
    ],
    "hideIrrelevantMethods": true,
    "attributes": {
      "posts": ["title"]
    },
    "include": [
      {"methods": "customMethod"},
      {"model": "post", "methods": "customMethod"},
      {"model": "person", "methods": ["customMethod1", "customMethod2"]}
    ]
  }
}
```

### restApiRoot
Url prefix to be used in conjunction with host and resource paths. eg. http://127.0.0.1:3214/api/people

#### example
```js
{
  ...
  "restApiRoot": "/api",
  ...
}
```

- Type: `string`
- Default: `/api`

### host
The url of the application, to be used when constructing links to relationships.  Useful where the service is proxied and the application believes
it is running on a different url to that seen by the consuming service.

#### example
```js
{
  ...
  "host": "https://www.mydomain.com",
  ...
}
```

- Type: `string`
- Default: `null`

### enable
Whether the component should be enabled or disabled. Defaults to `true`, flip it to `false` if you need to turn the component off without removing the configuration for some reason.

#### example
```js
{
  ...
  "enable": true,
  ...
}
```

- Type: `boolean`
- Default: `true`

### handleErrors
When true, the component will unregister all other error handling and
register a custom error handler which always returns errors in JSON API compliant
format. Validation errors include the correct properties in order to work
out of the box with EmberJS.

#### example
```js
{
  ...
  "handleErrors": true,
  ...
}
```

- Type: `boolean`
- Default: `true`

### errorStackInResponse
Along handleErrors, When true, this option will send the error stack if available within the error
response. It will be stored under the `source.stack` key.

**Please be careful, this option should never be enabled in a production environment. Doing so can expose sensitive data.**

#### example
```js
{
  ...
  "errorStackInResponse": NODE_ENV === 'development',
  ...
}
```

- Type: `boolean`
- Default: `false`

### handleCustomRemoteMethods
Allow all (custom) remote methods to be serialized by default.

This option can be overridden in any of the following ways:
1. Setting a jsonapi property to true or false in a remote method definition.
2. Globally adding the remote method to the component's exclude array.
3. Globally adding the remote method to the component's include array.

#### example
```js
{
  ...
  "handleCustomRemoteMethods": true,
  ...
}
```

- Type: `boolean`
- Default: `false`

### exclude
Allows blacklisting of models and methods.
Define an array of blacklist objects. Blacklist objects can contain "model" key
"methods" key or both. If just "model" is defined then all methods for the
specified model will not be serialized of deserialized using JSON API. If just the "methods" key is defined then
all methods specified on all models will not be serialized or deserialized using JSON API. If a combination of
"model" and "methods" keys are used then the specific combination of model and methods
specified will not be serialized or deserialized using JSON API.

#### example
```js
{
  ...
  "exclude": [
    {"model": "comment"},
    {"methods": "find"},
    {"model": "post", "methods": "find"},
    {"model": "person", "methods": ["find", "create"]}
  ],
  ...
}
```

- Type: `array`
- Default: `null`

#### Note
The default behavior is to modify (serialize to JSON API) the output of the following CRUD methods on all models:
- `find`
- `create`
- `updateAttributes`
- `deleteById`
- `findById`

In addition the following wild card method names are matched and the output is modified in order to handle relationships eg. `/api/posts/1/comments`
- `__get__.*`
- `__findRelationships__.*`

The default behavior is to modify (deserialize from JSON API) the input to the following CRUD methods on all models:
- `create`
- `updateAttributes`

### include
Allows whitelisting of methods.
Define an array of whitelist objects. Whitelist objects can contain a "methods" key
or both a "models" key and a "methods" key. If just the "methods" key is defined then
the methods specified will be serialized or deserialized using JSON API on all models that have
the specified methods. If a combination of
"model" and "methods" keys are used then the specific combination of model and methods
specified will be serialized or deserialized using JSON API.

Note: objects returned from a remote method that will be JSON API serialized MUST include
an id property. id property can be null.

#### example
```js
{
  ...
  "include": [
    {"methods": "customMethod"},
    {"model": "post", "methods": "customMethod"},
    {"model": "person", "methods": ["customMethod1", "customMethod2"]}
  ],
  ...
}
```

- Type: `array`
- Default: `null`

### hideIrrelevantMethods
By default, `loopback-component-jsonapi` disables a number of methods from each endpoint
that are not JSON API relevant. These methods are:
- `upsert`
- `exists`
- `findOne`
- `count`
- `createChangeStream`
- `updateAll`

You can use this option to prevent `loopback-component-jsonapi` from doing so. These methods are not modified by the component. Their output
will not be in a JSON API compliant format.

#### example
```js
{
  ...
  "hideIrrelevantMethods": true,
  ...
}
```

- Type: `boolean`
- Default: `true`

### attributes
By default, model properties will be converted to attributes in JSON API terms.
All model properties except the primary key and any foreign keys will be copied into
the attributes object before output. If you wish to limit which properties will
be output as attributes you can specify a whitelist of attributes for each type.

#### example
```js
{
  ...
  "attributes": {
    "posts": ["title", "content"],
    "comments": ["createdAt", "updatedAt", "comment"]
  }
  ...
}
```

- Type: `object`
- Default: `null`

#### note
The attributes arrays are keyed by type not by model name. Type is the term used by JSON API to describe the resource type in question and while not required by JSON API it is usually plural. In `loopback-component-jsonapi` it is whatever the models `plural` is set to in `model.json`. So in our example above we defined: `"posts": ["title", "content"]` as the resource type for the `post` model is `posts`

### foreignKeys
Allows configuration of whether the component should expose foreign keys (which the jsonapi spec considers
implementation details) from the attributes hash.

#### examples

Always expose foreign keys for all models
```js
{
  ...
  foreignKeys: true,
  ...
}
```

Never expose foreign keys for any models (default behaviour)
```js
{
  ...
  foreignKeys: false,
  ...
}
```

Only expose foreign keys for the commeht model
```js
{
  ...
  foreignKeys: [
    {model: 'comment'}
  ],
  ...
}
```

Only expose foreign keys for the comment model findById method. eg. `GET /api/comments/1`
```js
{
  ...
  foreignKeys: [
    {model: 'comment', method: 'findById'}
  ],
  ...
}
```

- Type: `boolean|array`
- Default: `false`

## Custom remote methods

### `jsonapi` remote method options
Sometimes you need to be able to control when a custom remote method should be handled by the component. By default, `loopback-component-jsonapi` will not handle (serialize or deserialize) custom remote methods. In order to tell the component to handle a custom remote method, you have the following options (In priority order):

1. Set `jsonapi` to `true` when defining a custom remote method.
2. Add the methods name to the component's `exclude` array setting. (see above)
3. Add the methods name to the component's `include` array setting. (see above)
4. Set `handleCustomRemoteMethods` to `true` in the component's settings. (see above)

This option takes precedence and sets the component to handle or not handle the custom remote method.

#### examples
```js
Post.remoteMethod('greet', {
  jsonapi: true
  returns: { root: true }
})
```
Ensures that the response from Post.greet will follow JSONApi format.

```js
Post.remoteMethod('greet', {
  jsonapi: false
  returns: { arg: 'greeting', type: 'string' }
})
```
Ensures that the response from Post.greet will never follow JSONApi format.

#### Note
You must always pass `root: true` to the `returns` object when using `loopback-component-jsonapi`. This is especialy important when you expect the response to be an array.

### Overriding serialization type
When `loopback-component-jsonapi` serializes a custom remote method, by default it will assume that the data being serialized is of the same type as the model the custom remote method is being defined on. Eg. For a remote method on a `Comment` model, it will be assumed that the data being returned from the remote method will be a comment or an array of comments. When this is not the case, you will need to set the type property in the `returns` object in the remote method definition.

*If an unknown type or no type are given, the model name will be used.*

#### example

```js
Post.remoteMethod('prototype.ownComments', {
  jsonapi: true
  returns: { root: true, type: 'comment' }
})
```

## Custom Serialization
For occasions where you need greater control over the serialization process, you can implement a custom serialization function for each model as needed. This function will be used instead of the regular serialization process.

#### example
```js
module.exports = function (MyModel) {
  MyModel.jsonApiSerialize = function (options, callback) {
    // either return an error
    var err = new Error('Unable to serialize record');
    err.status = 500;
    cb(err)

    // or return serialized records
    if (Array.isArray(options.records)) {
      // serialize an array of records
    } else {
      // serialize a single record
    }
    cb(null, options);
  }
}
```

##### function parameters

- `options` All config options set for the serialization process.
- `callback` Callback to call with error or serialized records

## Custom Deserialization
For occasions where you need greater control over the deserialization process, you can implement a custom deserialization function for each model as needed. This function will be used instead of the regular deserialization process.

#### example
```js
module.exports = function (MyModel) {
  MyModel.jsonApiDeserialize = function (options, callback) {
    // either return an error
    var err = new Error('Unable to deserialize record');
    err.status = 500;
    cb(err)

    // or
    // options.data is the raw data
    // options.result needs to be populated with deserialization result
    options.result = options.data.data.attributes;

    cb(null, options);
  }
}
```

## Custom Errors
Generic errors respond with a 500, but sometimes you want to have a better control over the error that is returned to the client, taking advantages of fields provided by JSONApi.

**It is recommended that you extend the base Error constructor before throwing errors. Eg. BadRequestError**

`meta` and `source` fields needs to be objects.

#### example
```js
module.exports = function (MyModel) {
  MyModel.find = function () {
    var err = new Error('April 1st, 1998');
    
    err.status = 418;
    err.name = 'I\'m a teapot';
    err.source = { model: 'Post', method: 'find' };
    err.detail = 'April 1st, 1998';
    err.code = 'i\'m a teapot';
    err.meta = { rfc: 'RFC2324' };

    throw err
  }
}

// This will be returned as :
// {
//   errors: [
//     {
//       status: 418,
//       meta: { rfc: 'RFC2324' },
//       code: 'i\'m a teapot',
//       detail: 'April 1st, 1998',
//       title: 'I\'m a teapot',
//       source: { model: 'Post', method: 'find' }
//     }
//   ]
// }
```

##### function parameters

- `options` All config options set for the deserialization process.
- `callback` Callback to call with error or serialized records

## The options object

###### `options.type`
Resource type. Originally calculated from a models plural. Is used in the default
serialization process to set the type property for each model in a JSON API response.
- eg. `posts`

###### `options.method`
The method that was called to get the data for the current request. This is not
used in the serialization process but is provided for custom hook and serialization
context.
- Eg. `create`, `updateAttributes`

###### `options.primaryKeyField`
The name of the property that is the primary key for the model. This is usually just
`id` unless defined differently in a model.json file.


###### `options.host`
The host part of the url including any port information.
- eg. `http://localhost:3000`

###### `options.restApiRoot`
The api prefix used before resource information. Can be used in conjunction with
`options.host` and `options.type` to build up the full url for a resource.
- eg. `/api`

###### `options.topLevelLinks`
Links object used at the top level of the JSON API response structure.
- eg. `{links: {self: 'http://localhost:3000/api/posts'}}`

###### `options.dataLinks`
Links object used to generate links for individual resource items. The structure is
and object with JSON API link keys such as `self` or `related` that are defined as
a function that will be called for each resource.

Eg.
```js
options.dataLinks: {
  self: function (resource) {
    return 'http://localhost:3000/posts/' + resource.id;
  }
}
```
As shown above, each resource gets passed to the function and the result of the
function is assigned to the key in the final JSON API response.

###### `options.relationships`
This contains all the relationship definitions for the model being serialized.
Relationship definition objects are in the same format as in loopback's `Model.relations`
definition. An object with relationship name keys, each having properties:

- `modelTo` loopback model object
- `keyTo` name of key on to model
- `modelFrom` loopback model object
- `keyFrom` name of key on from model
- `type` type of relationship (belongsTo, hasOne, hasMany)

This information is used to build relationship urls and even setup side-loaded
data correctly during the serialization process.

eg.
```js
options.relationships = {
  comments: { modelTo: ...etc },
  tags: { modelTo: ...etc }
}
```

###### `options.results`
This is the actual data to be serialized. In `beforeJsonApiSerialize` and
`jsonApiSerialize` this will be the raw data as you would ordinarily get it from
loopback. In `afterJsonApiSerialize` this will be the serialized data ready for
any final modifications.

###### `options.exclude`
This is the exclude settings as defined in the `exclude` configuration option
explained earlier. Use this in `beforeJsonApiSerialize` to make any model specific
adjustments before serialization.

###### `options.attributes`
This is the attributes settings as defined in the `attributes` configuration option
explained earlier. Use this in `beforeJsonApiSerialize` to make any model specific
adjustments before serialization.

###### `options.data`
The raw body data prior to deserialization from creates and updates. This can be
manipulated prior to deserialization using `beforeJsonApiDeserialize`

###### `options.result`
The deserialized raw body data. This is used when saving
models as part of a create or update operation. You can manipulate this prior to
the save occuring in `afterJsonApiDeserialize`

## Serialization/Deserialization Hooks
For occasions when you don't want to fully implement (de)serialization for a model manually but
you need to manipulate the serialization/deserialization process, you can use the
hooks `beforeJsonApiSerialize`, `afterJsonApiSerialize`, `beforeJsonApiDeserialize` and `afterJsonApiDeserialize`.

### beforeJsonApiDeserialize
In order to modify the deserialization process on a model by model basis, you can
define a `Model.beforeJsonApiDeserialize` function as shown below. The function
will be called with an options object and a callback which must be called with either
an error as the first argument or the modified options object as the second
parameter.

**Examples of things you might want to use this feature for**
- modifying `options.data.data.attributes` prior to their being deserialized into model properties that
will be saved
- modifying `options.data.data.relationships` prior to their being used to save relationship linkages

#### code example
```js
module.exports = function (MyModel) {
  MyModel.beforeJsonApiDeserialize = function (options, callback) {
    // either return an error
    var err = new Error('Unwilling to deserialize record');
    err.status = 500;
    callback(err)

    // or return modified data
    options.data.data.attributes.title = 'modified title';

    // returned options.data will be deserialized by either the default deserialization process
    // or by a custom deserialize function if one is present on the model.
    callback(null, options);
  }
}
```

### afterJsonApiDeserialize
This function will be called with an options object and a callback which must be called with either
an error as the first argument or the modified options object as the second parameter.

**Examples of things you might want to use this feature for**
- modifying `options.result` after their having being deserialized from `options.data.data.attributes`
- modifying `options.data.data.relationships` prior to their being used to save relationship linkages

#### code example
```js
module.exports = function (MyModel) {
  MyModel.afterJsonApiDeserialize = function (options, callback) {
    // either return an error
    var err = new Error('something went wrong!');
    err.status = 500;
    callback(err)

    // or return modified data prior to model being saved with options.result
    options.result.title = 'modified title';

    callback(null, options);
  }
}
```

##### function parameters
- `options` All config options set for the deserialization process. See the "the options object"
section above for info on what options properties are available for modification.
- `callback` Callback to call with error or options object.

### beforeJsonApiSerialize
In order to modify the serialization process on a model by model basis, you can
define a `Model.beforeJsonApiSerialize` function as shown below. The function
will be called with an options object and a callback which must be called with either
an error as the first argument or the modified options object as the second
parameter.

**Examples of things you might want to use this feature for**
- modify the record(s) before serialization by modifying `options.results`
- modify the resource type by modifying `options.type`
- setup serialization differently depending on `options.method`
- side load data (advanced)
- modify the way relationships are serialized

#### code example
```js
module.exports = function (MyModel) {
  MyModel.beforeJsonApiSerialize = function (options, callback) {
    // either return an error
    var err = new Error('Unable to serialize record');
    err.status = 500;
    callback(err)

    // or return modified records
    if (Array.isArray(options.results)) {
      // modify an array of records
    } else {
      // modify a single record
    }
    // returned options.records will be serialized by either the default serialization process
    // or by a custom serialize function (described above) if one is present on the model.
    callback(null, options);
  }
}
```

##### function parameters
- `options` All config options set for the serialization process. See the "function parameters"
section above for info on what options properties are available for modification.
- `callback` Callback to call with error or options object.

#### example use case
Because the `beforeJsonApiSerialize` method is passed all the options that will
be used during serialization, it is possible to tweak options to affect the
serialization process. One example of this is modifying the `type` option to
change the resource type that will be output.

```js
module.exports = function (MyModel) {
  MyModel.beforeJsonApiSerialize = function (options, callback) {
    options.type = 'mycustommodels';
    cb(null, options);
  }
}
```

### afterJsonApiSerialize
In order to modify the serialized data on a model by model basis, you can
define a `Model.afterJsonApiSerialize` function as shown below. The function
will be called with an options object and a callback which must be called with either
an error as the first argument or the modified options object as the second
parameter.

#### example
```js
module.exports = function (MyModel) {
  MyModel.afterJsonApiSerialize = function (options, callback) {
    // either return an error
    var err = new Error('Unable to modify serialized record');
    err.status = 500;
    callback(err)

    // or return modified records
    if (Array.isArray(options.results)) {
      // modify an array of serialized records
    } else {
      // modify a single serialized record
    }
    // returned options.records will be output through the api.
    callback(null, options);
  }
}
```

##### function parameters
- `options` All config options set for the serialization process
- `callback` Callback to call with modified serialized records
