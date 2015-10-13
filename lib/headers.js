'use strict';

var bodyParser = require('body-parser');

module.exports = function (app, options) {

  //registered at the beginning of the routes phase due to usage of
  //express app.use instead of app.middleware.
  //We need to do this as bodyParser doesn't support
  //JSON APIs application/vnd.api+json format by default
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
};
