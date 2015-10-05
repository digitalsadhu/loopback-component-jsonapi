"use strict";

var bodyParser = require('body-parser');

module.exports = function (app, options) {
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
}
