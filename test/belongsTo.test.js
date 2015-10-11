var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../')
var app;
var Post;
var Comment;
var Person;
var ds;

describe('loopback json api hasOne relationships', function() {
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
    Comment.settings.plural = 'comments';
    Comment.belongsTo(Post, {as: 'post', foreignKey: 'postId'});

    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('Comments without a post', function (done) {
    beforeEach(function (done) {
      Comment.create({
        title: 'my comment',
        comment: 'my post comment'
      }, done);
    });

    describe('GET /comments/1/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/post')
          .expect(200)
          .end(done);
      });

      it('should return `null` keyed by `data`', function (done) {
        request(app).get('/comments/1/post')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/comments\/1\/post/);
            expect(res.body.data).to.equal(null);
            done();
          });
      });
    });

    describe('GET /comments/1/relationships/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/relationships/post')
          .expect(200)
          .end(done);
      });

      it('should return `null` keyed by `data`', function (done) {
        request(app).get('/comments/1/relationships/post')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/comments\/1\/relationships\/post/);
            expect(res.body.links.related).to.match(/comments\/1\/post/);
            expect(res.body.data).to.equal(null);
            done();
          });
      });
    });
  });

  describe('Comment with an post', function (done) {
    beforeEach(function (done) {
      Comment.create({
        title: 'my comment',
        comment: 'my post comment'
      }, function (err, comment) {
        comment.post.create({
          title: 'My post',
          content: 'My post content'
        }, done);
      });
    });

    describe('GET /comments/1/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/post')
          .expect(200)
          .end(done);
      });

      it('should display a single resource object keyed by `data`', function (done) {
        request(app).get('/comments/1/post')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/comments\/1\/post/);
            expect(res.body.data.attributes).to.deep.equal({
              title: 'My post',
              content: 'My post content'
            });
            expect(res.body.data.type).to.equal('posts');
            expect(res.body.data.id).to.equal('1');
            expect(res.body.data.links.self).to.match(/^http.*\/posts\/1$/);
            done();
          });
      });
    });

    describe('GET /comments/1/relationships/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/relationships/post')
          .expect(200)
          .end(done);
      });

      it('should display a single resource object keyed by `data`', function (done) {
        request(app).get('/comments/1/relationships/post')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/comments\/1\/relationships\/post/);
            expect(res.body.links.related).to.match(/comments\/1\/post/);
            expect(res.body.data).to.deep.equal({
                type: 'posts',
                id: '1'
            });
            done();
          });
      });
    });
  });
});
