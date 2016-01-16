var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var Post;
var Comment;

describe('include option', function () {
  beforeEach(function (done) {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');

    Post = ds.createModel('post', { title: String });
    app.model(Post);
    Post.customMethod = function (cb) {
      cb(null, {prop: 'value', id: null});
    };
    Post.remoteMethod('customMethod', {
      http: {verb: 'get', path: '/custom'},
      returns: {root: true}
    });
    Post.customMethod2 = function (cb) {
      cb(null, {prop: 'value', id: null});
    };
    Post.remoteMethod('customMethod2', {
      http: {verb: 'get', path: '/custom2'},
      returns: {root: true}
    });

    Comment = ds.createModel('comment', { comment: String });
    app.model(Comment);
    Comment.customMethod = function (cb) {
      cb(null, {prop: 'value', id: null});
    };
    Comment.remoteMethod('customMethod', {
      http: {verb: 'get', path: '/custom'},
      returns: {root: true}
    });

    app.use(loopback.rest());

    Post.create({title: 'my post'}, function () {
      Comment.create({comment: 'my comment'}, done);
    });
  });

  describe('including a specific method', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        include: [
          {methods: 'customMethod'}
        ]
      });
    });

    it('should apply jsonapi to post model output for customMethod method', function (done) {
      request(app).get('/posts/custom')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data).to.have.keys('id', 'type', 'attributes', 'links');
          done();
        });
    });

    it('should apply jsonapi to comment model output for customMethod method', function (done) {
      request(app).get('/comments/custom')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data).to.have.keys('id', 'type', 'attributes', 'links');
          done();
        });
    });
  });

  describe('including a specific method on a specific model', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        include: [
          {model: 'post', methods: 'customMethod'}
        ]
      });
    });

    it('should apply jsonapi to post model output for customMethod method', function (done) {
      request(app).get('/posts/custom')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data).to.have.keys('id', 'type', 'attributes', 'links');
          done();
        });
    });

    it('should not apply jsonapi to comment model output for customMethod method', function (done) {
      request(app).get('/comments/custom')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.deep.equal({ prop: 'value', id: null });
          done();
        });
    });
  });

  describe('including a specific set of methods on a specific model', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        include: [
          {model: 'post', methods: ['customMethod', 'customMethod2']}
        ]
      });
    });

    it('should apply jsonapi to post model output for customMethod method', function (done) {
      request(app).get('/posts/custom')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data).to.have.keys('id', 'type', 'attributes', 'links');
          done();
        });
    });

    it('should apply jsonapi to post model output for customMethod method', function (done) {
      request(app).get('/posts/custom2')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.data).to.have.keys('id', 'type', 'attributes', 'links');
          done();
        });
    });
  });
});
