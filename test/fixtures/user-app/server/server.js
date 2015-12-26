var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
app.enableAuth();
boot(app, __dirname);
app.use(loopback.token({model: app.models.AccessToken}));
app.use('/', loopback.rest());