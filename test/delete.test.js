var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../')
var app;
var Post;

describe('loopback json api component delete method', function() {
  var MyModel;
  beforeEach(function(done) {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    });
    app.model(Post);
    app.use(loopback.rest());
    JSONAPIComponent(app);
    Post.create({
      title: 'my post',
      content: 'my post content'
    }, done)
  });

  describe('headers', function () {
    it('DELETE /models/:id should have the JSON API Content-Type header set on the response', function (done) {
      request(app).delete('/posts/1')
        .expect('Content-Type', 'application/vnd.api+json')
        .end(done);
    });
  });

  describe('status code', function () {
    it('DELETE /models/:id should return a 204 NO CONTENT', function (done) {
      request(app).delete('/posts/1')
        .expect(204)
        .end(done);
    });
  });
});
