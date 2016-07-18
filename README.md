# loopback-component-jsonapi

[![Join the chat at https://gitter.im/digitalsadhu/loopback-component-jsonapi](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/digitalsadhu/loopback-component-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi.svg)](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi)
[![npm version](https://badge.fury.io/js/loopback-component-jsonapi.svg)](http://badge.fury.io/js/loopback-component-jsonapi)
[![Dependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi)
[![devDependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi/dev-status.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/digitalsadhu/loopback-component-jsonapi/badge.svg?branch=master)](https://coveralls.io/github/digitalsadhu/loopback-component-jsonapi?branch=master)

[jsonapi.org](http://jsonapi.org/) support for loopback.

## Status
This project is a work in progress. Consider it beta software. For EmberJS users, the component
should now be basically feature complete. Please test and report any issues.
The functionality that is present is pretty well tested. 140+ integration tests and counting!

Currently supported:
- Find all records via GET
- Find a record by ID via GET
- Create via POST
- Update a record via PATCH
- Delete a record via DELETE
- All errors have now been transformed into the correct JSON API format
- Find related records via GET eg. /posts/1/comments (belongsTo, hasMany, hasOne)
- Find relationships via GET eg. /posts/1/relationships/author (belongsTo, hasMany, hasOne)
- Creating resource relationship linkages during a resource create
- Updating/deleting resource relationship linkages during a resource update
- [Side loading data](http://jsonapi.org/format/#fetching-includes) via `include` param

Not yet supported:
- manipulating relationships directly via:
  - POST /:resource/relationships/:relatedResource
  - PATCH /:resource/relationships/:relatedResource
  - DELETE /:resource/relationships/:relatedResource

## Requirements
- JSON API v1.0
- loopback ^v2.0.0
- strong-remoting ^v2.22.0

## Sample Project
We have created a sample project using [EmberJS](http://emberjs.com), [Loopback](http://loopback.io) and this compoment. It's called [emberloop](https://github.com/tsteuwer/emberloop).

## Helping out
We are VERY interested in help. Get in touch via the [issue tracker](https://github.com/digitalsadhu/loopback-component-jsonapi/issues)

## Usage
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

###### `options.requestedIncludes`
The relationships that the user has requested be side loaded with the request.
For example, for the request `GET /api/posts?include=comments` options.requestedIncludes
would be `'comments'`.
- Type: `string` or `array`
- eg: `'comments'` or `['posts', 'comments']`

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

## Debugging
You can enable debug logging by setting an environment variable:
`DEBUG=loopback-component-jsonapi`

#### example:
```
DEBUG=loopback-component-jsonapi node .
```
