var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../')
var app;
var Post;
var Comment;
var Person;
var ds;

describe('loopback json api hasMany relationships', function() {
  beforeEach(function() {
    app = loopback();
    app.set('legacyExplorer', false);
    ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    });
    app.model(Post);

    Comment = ds.createModel('comment', {
      id: {type: Number, id: true},
      postId: Number,
      title: String,
      comment: String
    });
    app.model(Comment);
    Post.hasMany(Comment, {as: 'comments', foreignKey: 'postId'});

    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('Post with no comments', function (done) {
    beforeEach(function (done) {
      Post.create({
        title: 'my post without comments',
        content: 'my post without comments content'
      }, done);
    });

    describe('GET /posts/1/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/comments')
          .expect(200)
          .end(done);
      });

      it('should display an empty array keyed by `data`', function (done) {
        request(app).get('/posts/1/comments')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
            done();
          });
      });
    });

    describe('GET /posts/1/relationships/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/relationships/comments')
          .expect(200)
          .end(done);
      });

      it('should display an empty array keyed by `data`', function (done) {
        request(app).get('/posts/1/relationships/comments')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
            done();
          });
      });
    });
  });

  describe('Post with a comment', function (done) {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, function (err, post) {
        post.comments.create({
          title: 'My comment',
          comment: 'My comment text'
        }, done);
      });
    });

    describe('GET /posts/1/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/comments')
          .expect(200)
          .end(done);
      });

      it('should display a single item array keyed by `data`', function (done) {
        request(app).get('/posts/1/comments')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(1);
            done();
          });
      });
    });

    describe('GET /posts/1/relationships/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/relationships/comments')
          .expect(200)
          .end(done);
      });

      it('should display a single item array keyed by `data`', function (done) {
        request(app).get('/posts/1/relationships/comments')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(1);
            done();
          });
      });
    });
  });
});
