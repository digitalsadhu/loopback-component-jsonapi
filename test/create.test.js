var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var query = require('./util/query');
var JSONAPIComponent = require('../');
var app;
var Post;

describe('loopback json api component create method', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String,
      isDraft: Boolean
    });
    app.model(Post);
    app.use(loopback.rest());
    JSONAPIComponent(app, { restApiRoot: '' });
  });

  describe('headers', function () {
    it('POST /models should be created when Accept header is set to application/vnd.api+json', function (done) {
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
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(done);
    });
    it('POST /models should have the JSON API Content-Type header set on response', function (done) {
      var data = {
        data: {
          type: 'posts',
          attributes: {
            title: 'my post',
            content: 'my post content'
          }
        }
      };

      var options = {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        }
      };

      //use http module via util to make this post to check headers are working since
      //superagent/supertest breaks when trying to use JSON API Content-Type header
      //waiting on a fix
      //see https://github.com/visionmedia/superagent/issues/753
      query(app).post('/posts', data, options, function (err, res) {
        if (err) console.log(err);
        expect(res.headers['content-type']).to.match(/application\/vnd\.api\+json/);
        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.all.keys('data');
        expect(res.body.data).to.have.all.keys('type', 'id', 'links', 'attributes');
        done();
      });
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
          expect(err).to.equal(null);
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
              content: 'my post content',
              'is-draft': true
            }
          }
        })
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.have.all.keys('data');
          expect(res.body.data).to.have.all.keys('id', 'type', 'attributes', 'links');
          expect(res.body.data.id).to.equal('1');
          expect(res.body.data.type).to.equal('posts');
          expect(res.body.data.attributes).to.have.all.keys('title', 'content', 'isDraft');
          expect(res.body.data.attributes).to.not.have.keys('id');
          done();
        });
    });
  });
});
