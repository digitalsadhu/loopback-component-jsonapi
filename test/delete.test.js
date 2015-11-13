var request = require('supertest');
var loopback = require('loopback');
var JSONAPIComponent = require('../');
var app;
var Post;

describe('loopback json api component delete method', function () {
  beforeEach(function (done) {
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
    }, done);
  });

  describe('status code', function () {
    it('DELETE /models/:id should return a 204 NO CONTENT', function (done) {
      request(app).delete('/posts/1')
        .expect(204)
        .end(done);
    });
  });
});
