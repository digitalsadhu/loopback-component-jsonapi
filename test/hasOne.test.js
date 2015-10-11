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

    Person = ds.createModel('person', {
      id: {type: Number, id: true},
      postId: Number,
      name: String
    });
    app.model(Person);
    Post.hasOne(Person, {as: 'author', foreignKey: 'postId'});
    Person.settings.plural = 'people';

    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('Post without an author', function (done) {
    beforeEach(function (done) {
      Post.create({
        name: 'my post',
        content: 'my post content'
      }, done);
    });

    describe('GET /posts/1/author', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/author')
          .expect(200)
          .end(done);
      });

      it('should return `null` keyed by `data`', function (done) {
        request(app).get('/posts/1/author')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/posts\/1\/author/);
            expect(res.body.data).to.equal(null);
            done();
          });
      });
    });

    describe('GET /posts/1/relationships/author', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/relationships/author')
          .expect(200)
          .end(done);
      });

      it('should return `null` keyed by `data`', function (done) {
        request(app).get('/posts/1/relationships/author')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/posts\/1\/relationships\/author/);
            expect(res.body.links.related).to.match(/posts\/1\/author/);
            expect(res.body.data).to.equal(null);
            done();
          });
      });
    });
  });

  describe('Post with an author', function (done) {
    beforeEach(function (done) {
      Post.create({
        name: 'my post',
        content: 'my post content'
      }, function (err, post) {
        post.author.create({
          name: 'Bob Jones'
        }, done);
      });
    });

    describe('GET /posts/1/author', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/author')
          .expect(200)
          .end(done);
      });

      it('should display a single resource object keyed by `data`', function (done) {
        request(app).get('/posts/1/author')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/posts\/1\/author/);
            expect(res.body.data.attributes).to.deep.equal({
                name: 'Bob Jones',
                'post-id': 1
            });
            expect(res.body.data.type).to.equal('people');
            expect(res.body.data.id).to.equal('1');
            expect(res.body.data.links.self).to.match(/^http.*\/people\/1$/);
            done();
          });
      });
    });

    describe('GET /posts/1/relationships/author', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/relationships/author')
          .expect(200)
          .end(done);
      });

      it('should display a single resource object keyed by `data`', function (done) {
        request(app).get('/posts/1/relationships/author')
          .end(function (err, res) {
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/posts\/1\/relationships\/author/);
            expect(res.body.links.related).to.match(/posts\/1\/author/);
            expect(res.body.data).to.deep.equal({
                type: 'people',
                id: '1'
            });
            done();
          });
      });
    });
  });
});
