var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../')
var app;
var Post;

describe('loopback json api component create method', function() {
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
    it('POST /models should have the JSON API Content-Type header set on response', function (done) {
      //TODO: superagent/supertest breaks when trying to use JSON API Content-Type header
      //waiting on a fix
      //see https://github.com/visionmedia/superagent/issues/753
      //using Content-Type: application/json in the mean time.
      //Have tested correct header using curl and all is well
      // request(app).post('/posts')
      //   .send({
      //     data: {
      //       type: 'posts',
      //       attributes: {
      //         title: 'my post',
      //         content: 'my post content'
      //       }
      //     }
      //   })
      //   .set('Content-Type', 'application/vnd.api+json')
      //   .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
      //   .end(done);
      done();
    });

    it('POST /models should have the Location header set on response', function (done) {
      request(app).post('/posts')
        .send({
          data: {
            type: 'posts',
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
        .expect('Location', /^http:\/\/127\.0\.0\.1.*\/posts\/1/)
        .end(done);
    });
  });

  describe('status codes', function () {
    it('POST /models should return a 201 CREATED status code', function (done) {
      request(app).post('/posts')
        .send({
          data: {
            type: 'posts',
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(done);
    });
  });

  describe('self links', function () {
    it('should produce resource level self links', function (done) {
      request(app).post('/posts')
        .send({
          data: {
            type: 'posts',
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          expect(res.body).to.have.deep.property('data.links.self');
          expect(res.body.data.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts\/1/);
          done();
        });
    });
  });

  describe('Creating a resource using POST /models', function () {
    it('POST /models should return a correct JSON API response', function (done) {
      request(app).post('/posts')
        .send({
          data: {
            type: 'posts',
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          expect(res.body).to.have.all.keys('data');
          expect(res.body.data).to.have.all.keys('id', 'type', 'attributes', 'links');
          expect(res.body.data.id).to.equal('1');
          expect(res.body.data.type).to.equal('posts');
          expect(res.body.data.attributes).to.have.all.keys('title', 'content');
          expect(res.body.data.attributes).to.not.have.keys('id');
          done();
        });
    });
  });

  describe('Errors', function () {
    it('POST /models should return an 422 error if type key is not present', function (done) {
      request(app).post('/posts')
        .send({
          data: {
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .expect(422)
        .set('Content-Type', 'application/json')
        .end(done)
    });

    it('POST /models should return an 422 error if model title is not present', function (done) {
      Post.validatesPresenceOf('title');

      request(app).post('/posts')
        .send({ data: { type: 'posts' } })
        .expect(422)
        .set('Content-Type', 'application/json')
        .end(done);
    });

    it('POST /models should return an 422 error if model title is not present', function (done) {
      Post.validatesPresenceOf('title');
      Post.validatesPresenceOf('content');

      request(app).post('/posts')
        .send({ data: { type: 'posts' } })
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          expect(res.body).to.have.keys('errors');
          expect(res.body.errors.length).to.equal(2);
          expect(res.body.errors[0]).to.deep.equal({
            status: 422,
            source: { pointer: 'data/attributes/title' },
            title: 'ValidationError',
            code: 'presence',
            detail: 'can\'t be blank'
          });
          done();
        });
    });
  });
});
