# loopback-component-jsonapi

[![Join the chat at https://gitter.im/digitalsadhu/loopback-component-jsonapi](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/digitalsadhu/loopback-component-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi.svg)](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi)
[![npm version](https://badge.fury.io/js/loopback-component-jsonapi.svg)](http://badge.fury.io/js/loopback-component-jsonapi)
[![Dependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi)
[![devDependency Status](https://david-dm.org/digitalsadhu/loopback-component-jsonapi/dev-status.svg)](https://david-dm.org/digitalsadhu/loopback-component-jsonapi#info=devDependencies)

JSONAPI support for loopback.

## JSON API Spec
[http://jsonapi.org/](http://jsonapi.org/)

## Status
This project is a work in progress. Consider it alpha software.
I am VERY interested in help to get this module over the line. See the [issue tracker](https://github.com/digitalsadhu/loopback-component-jsonapi/issues)

Currently supported:
- Find all records via GET
- Find a record by ID via GET
- Create via POST
- Update a record via PATCH
- Delete a record via DELETE
- All errors have now been transformed into the correct JSON API format
- Find related records via GET eg. /posts/1/comments (belongsTo, hasMany, hasOne)
- Find relationships via GET eg. /posts/1/relationships/author (belongsTo, hasMany, hasOne)

Not yet properly supported:
- Create relationship via POST (hasMany, belongsTo, hasOne, etc)
- Update relationship via PATCH (hasMany, belongsTo, hasOne, etc)
- Delete relationship via DELETE (hasMany, belongsTo, hasOne, etc)
- [Fetching includes](http://jsonapi.org/format/#fetching-includes)

## Requirements
- loopback ^v2.0.0
- strong-remoting ^v2.22.0

## Sample Project
We have created a sample project using [EmberJS](http://emberjs.com), [Loopback](http://loopback.io) and this compoment. It's called [emberloop](https://github.com/tsteuwer/emberloop).

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
In a fairly limited way, you can configure a how the component behaves.

Example:
```json
{
  "loopback-component-jsonapi": {
    "restApiRoot": "/api",
    "enable": true
  }
}
```
### restApiRoot
Url prefix to be used in conjunction with host and resource paths.
eg. http://127.0.0.1:3214/api/people
Default: `/api`

### enable
Whether the component should be enabled or disabled.
Default: true

## Debugging
You can enable debug logging by setting an environment variable:
DEBUG=loopback-component-jsonapi

Example:
```
DEBUG=loopback-component-jsonapi node .
```
