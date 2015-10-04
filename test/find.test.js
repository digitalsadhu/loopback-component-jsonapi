var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../')
var app;
var Post;

describe('loopback json api component find methods', function() {
  var MyModel;
  beforeEach(function() {
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
  });

  describe('headers', function () {
    it('GET /models should have the JSON API Content-Type header set on collection responses', function (done) {
      request(app).get('/posts')
        .expect(200)
        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
        .end(done);
    });

    it('GET /models/:id should have the JSON API Content-Type header set on individual resource responses', function (done) {
      request(app).get('/posts/1')
        .expect(404)
        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
        .end(done);
    });
  })

  describe('self links', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, done)
    })

    //TODO: see https://github.com/digitalsadhu/loopback-component-jsonapi/issues/11
    it('should produce correct top level self links')

    it('should produce resource level self links', function (done) {
      request(app).get('/posts/1')
        .expect(200)
        .end(function (err, res) {
          expect(res.body).to.have.deep.property('data.links.self');
          expect(res.body.data.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts\/1/);
          done();
        });
    })
  })

  describe('empty responses', function () {
    it('GET /models should return an empty JSON API resource object when there are no results', function(done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          expect(res.body).to.be.an('object');
          expect(res.body.links).to.be.an('object');
          // expect(res.body.links.self).to.match(/^http:\/\/127.0.0.1:.*\/api\/posts/);
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.equal(0);
          done();
        });
    });

    it('GET model/:id should return a 404 when there are no results', function(done) {
      request(app).get('/posts/1')
        .expect(404)
        .end(done);
    });
  });

  describe('non empty reponses', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, done)
    })

    it('GET /models/ should return a JSON API response with 1 item', function (done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          expect(res.body).to.have.all.keys('links', 'data');
          expect(res.body.links).to.have.all.keys('self');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data.length).to.equal(1);
          expect(res.body.data[0]).to.have.all.keys('id', 'type', 'attributes', 'links');
          expect(res.body.data[0].id).to.equal('1');
          expect(res.body.data[0].type).to.equal('posts');
          expect(res.body.data[0].attributes).to.have.all.keys('title', 'content');
          expect(res.body.data[0].attributes).to.not.have.keys('id');
          done();
        });
    });

    it('GET /models/:id should return a correct JSON API response', function (done) {
      request(app).get('/posts/1')
        .expect(200)
        .end(function (err, res) {
          expect(res.body).to.have.all.keys('links', 'data');
          expect(res.body.links).to.have.all.keys('self');
          expect(res.body.data).to.have.all.keys('id', 'type', 'attributes', 'links');
          expect(res.body.data.id).to.equal('1');
          expect(res.body.data.type).to.equal('posts');
          expect(res.body.data.attributes).to.have.all.keys('title', 'content');
          expect(res.body.data.attributes).to.not.have.keys('id');
          done();
        });
    });

  });
});
