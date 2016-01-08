# loopback-component-jsonapi

[![Join the chat at https://gitter.im/digitalsadhu/loopback-component-jsonapi](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/digitalsadhu/loopback-component-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi.svg)](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi)
[![npm version](https://badge.fury.io/js/loopback-component-jsonapi.svg)](http://badge.fury.io/js/loopback-component-jsonapi)
[![Dependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi)
[![devDependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi/dev-status.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi#info=devDependencies)

[jsonapi.org](http://jsonapi.org/) support for loopback.

## Status
This project is a work in progress. Consider it beta software. For ember users, the component
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
We are aiming to make the component as configureable as possible. You can configure a how the component behaves with the options shown and listed below. If there is something else you would like to see be configureable, please submit an issue on the repository.

Example:
(all configuration options listed)
```json
{
  "loopback-component-jsonapi": {
    "restApiRoot": "/api",
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
    }
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

### enable
Whether the component should be enabled or disabled. Defaults to `false`, flip it to `true` if you need to turn the component off without removing the configuration for some reason.

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
register a custom error handler which always returns errors in jsonapi compliant
format. Validation errors include the correct properties in order to work
out of the box with ember.

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
specified model will not be serialized of deserialized using jsonapi. If just the "methods" key is defined then
all methods specified on all models will be serialized or deserialized using jsonapi. If a combination of
"model" and "methods" keys are used then the specific combination of model and methods
specified will not be serialized or deserialized using jsonapi.

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
The default component behavior is to modify the output of the following CRUD model methods
methods on all models:
- `find`
- `create`
- `updateAttributes`
- `deleteById`
- `findById`

In addition the following wild card method names are matched and the output is modified in order to handle relationships eg. `/api/posts/1/comments`
- `__get__.*`
- `__findRelationships__.*`

The default behavior for modifying input only applies to the following methods on all models:
- `create`
- `updateAttributes`

### hideIrrelevantMethods
By default, `loopback-component-jsonapi` disables a number of methods from each endpoint
that are not jsonapi relevant. These methods are:
- `upsert`
- `exists`
- `findOne`
- `count`
- `createChangeStream`
- `updateAll`

You can use this option to prevent `loopback-component-jsonapi` from doing so. These methods are not modified by the component. Their output
will not be in a jsonapi compliant format.

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
By default, model properties will be converted to attributes in jsonapi terms.
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
The attributes arrays are keyed by type not by model name. Type is the term used by json api to describe the resource type in question and while not required by json api it is usually plural. In `loopback-component-jsonapi` it is whatever the models `plural` is set to in `model.json`. So in our example above we defined: `"posts": ["title", "content"]` as the resource type for the `post` model is `posts`

## Debugging
You can enable debug logging by setting an environment variable:
`DEBUG=loopback-component-jsonapi`

#### example:
```
DEBUG=loopback-component-jsonapi node .
```
