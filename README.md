# loopback-component-jsonapi

[![Join the chat at https://gitter.im/digitalsadhu/loopback-component-jsonapi](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/digitalsadhu/loopback-component-jsonapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi.svg)](https://travis-ci.org/digitalsadhu/loopback-component-jsonapi)
[![npm version](https://badge.fury.io/js/loopback-component-jsonapi.svg)](http://badge.fury.io/js/loopback-component-jsonapi)

JSONAPI support for loopback.

## Status
This project is a work in progress. Consider it alpha software.
I am VERY interested in help to get this module over the line. See the [issue tracker](https://github.com/digitalsadhu/loopback-component-jsonapi/issues)

Currently supported:
- Find all records via GET
- Find a record by ID via GET
- Create via POST
- Update a record via PATCH
- Delete a record via DELETE
- 422 Error output in JSON API format (validation errors)
- Some 500 errors are formatted in JSON API format

Not yet properly supported:
- hasMany relations
- hasOne relations
- belongsTo relations
- 404 Errors are not yet correctly formatted
- Some 500 Errors are not yet correctly formatted

## Usage
In your loopback project:

1. `npm install --save loopback-component-jsonapi`
2. Create a `component-config.json` file in your server folder (if you don't already have one)
3. Add the following config to `component-config.json`
```json
{
  "loopback-component-jsonapi": {
    "restApiRoot": "/api"
  }
}
```
