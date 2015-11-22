var request = require('supertest');
var loopback = require('loopback');
var JSONAPIComponent = require('../');
var expect = require('chai').expect;
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

  describe('Status codes', function () {
    it('DELETE /models/:id should return a 204 NO CONTENT', function (done) {
      request(app).delete('/posts/1')
        .expect(204)
        .end(done);
    });

    it('DELETE /models/:id?include=anything should return a 400 error for invalid `include` parameter', function (done) {
      request(app)
        .delete('/posts/1?include=anything')
        .expect(400)
        .end(function (err, res) {
					expect(res.body.errors).to.be.a('array');
					expect(res.body.errors.length).to.equal(1);
					expect(res.body.errors[0].title).to.equal('ValidationError');
					expect(res.body.errors[0].code).to.equal('presence');
					expect(res.body.errors[0].detail).to.equal('JSON API resource does not support `include`');
					done();
				});
    });
  });
});
