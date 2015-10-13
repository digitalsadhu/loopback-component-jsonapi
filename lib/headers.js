'use strict';

var bodyParser = require('body-parser');

module.exports = function (app, options) {

  //registered at the beginning of the routes phase due to usage of
  //express app.use instead of app.middleware
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
};
