var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var Post;
var Comment;

describe('attributes option', function () {
  beforeEach(function (done) {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');

    Post = ds.createModel('post', { title: String, content: String, other: String });
    app.model(Post);

    Comment = ds.createModel('comment', { title: String, comment: String, other: String });
    app.model(Comment);

    app.use(loopback.rest());

    Post.create({title: 'my post', content: 'my post content', other: 'my post other'}, function () {
      Comment.create({title: 'my comment title', comment: 'my comment', other: 'comment other'}, done);
    });
  });

  describe('whitelisting model attributes', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        attributes: {
          posts: ['title']
        }
      });
    });

    it('should return only title in attributes for posts', function (done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data[0].attributes).to.deep.equal({ title: 'my post' });
          done();
        });
    });

    it('should return all attributes for comments', function (done) {
      request(app).get('/comments')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data[0].attributes).to.deep.equal({
            title: 'my comment title',
            comment: 'my comment',
            other: 'comment other'
          });
          done();
        });
    });

    it('should return only title in attributes for a post', function (done) {
      request(app).get('/posts/1')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data.attributes).to.deep.equal({ title: 'my post' });
          done();
        });
    });

    it('should return all attributes for a comment', function (done) {
      request(app).get('/comments/1')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data.attributes).to.deep.equal({
            title: 'my comment title',
            comment: 'my comment',
            other: 'comment other'
          });
          done();
        });
    });
  });
});
