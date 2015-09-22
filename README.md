# loopback-component-jsonapi
JSONAPI support for loopback.

## Status
This project is a work in progress. Consider it alpha software.
I am VERY interested in help to get this module over the line. Unit tests need to be written
among other things.

Currently, there is pretty good support for output serializing to json api.
Creation of records via POST has basic supported but needs improvement when it comes to relationships.
PATCH is not yet supported so PUT currently needs to be used for updates.

## Usage
In your loopback project:

1. `npm install --save loopback-component-jsonapi`
2. Create a `component-config.json` file in your server folder
3. Add the following config to `component-config.json`
```json
{
  "loopback-component-jsonapi": {
    "restApiRoot": "/api"
  }
}
```
