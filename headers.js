"use strict";

module.exports = function (app, options) {
  app.use(function (req, res, next) {
    if (req.header('Content-Type') && req.header('Content-Type') === 'application/vnd.api+json') {
      req.rawBody = '';
      req.setEncoding('utf8');

      req.on('data', function(chunk) {
        req.rawBody += chunk;
      });

      req.on('end', function() {
        try {
          req.body = JSON.parse(req.rawBody)
        } catch (e) {
          console.error('failed to parse raw request body')
        }
        console.log(req.body)
        next();
      });
    } else {
      console.log(req.body)
      next();
    }
  });
}
