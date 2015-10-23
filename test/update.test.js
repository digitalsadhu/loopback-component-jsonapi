var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var Post;

describe('loopback json api component update method', function () {
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

  describe('headers', function () {
    it('PATCH /models/:id should have the JSON API Content-Type header set on response', function (done) {
      //TODO: superagent/supertest breaks when trying to use JSON API Content-Type header
      //waiting on a fix
      //see https://github.com/visionmedia/superagent/issues/753
      //using Content-Type: application/json in the mean time.
      //Have tested correct header using curl and all is well
      // request(app).patch('/posts/1')
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
  });

  describe('status codes', function () {
    it('PATCH /models/:id should return a 200 status code', function (done) {
      request(app).patch('/posts/1')
        .send({
          data: {
            type: 'posts',
            id: 1,
            attributes: {
              title: 'my post title changed',
              content: 'my post content changed'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(done);
    });

    it('PATCH /models/:id should return 404 when attempting to edit non existing resource', function (done) {
      request(app).patch('/posts/10')
        .send({
          data: {
            type: 'posts',
            id: 10,
            attributes: {
              title: 'my post title changed',
              content: 'my post content changed'
            }
          }
        })
        .expect(404)
        .end(done);
    });
  });

  describe('self links', function () {
    it('should produce resource level self links', function (done) {
      request(app).patch('/posts/1')
        .send({
          data: {
            type: 'posts',
            id: 1,
            attributes: {
              title: 'my post title changed',
              content: 'my post content changed'
            }
          }
        })
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          console.log(res.body);
          expect(err).to.equal(null);
          expect(res.body).to.have.deep.property('data.links.self');
          expect(res.body.data.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts\/1/);
          done();
        });
    });
  });

  describe('Creating a resource using PATCH /models/:id', function () {
    it('PATCH /models/:id should return a correct JSON API response', function (done) {
      request(app).patch('/posts/1')
        .send({
          data: {
            type: 'posts',
            id: 1,
            attributes: {
              title: 'my post title changed',
              content: 'my post content changed'
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
          expect(res.body.data.attributes).to.have.all.keys('title', 'content');
          expect(res.body.data.attributes).to.not.have.keys('id');
          expect(res.body.data.attributes.title).to.equal('my post title changed');
          expect(res.body.data.attributes.content).to.equal('my post content changed');
          done();
        });
    });
  });

  describe('Errors', function () {
    it('PATCH /models/:id with empty `attributes` should not return an error', function (done) {
      request(app).patch('/posts/1')
        .send({ data: { type: 'posts', id: 1, attributes: { } } })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(done);
    });

    it('PATCH /models/:id with no `attributes` should not return an error', function (done) {
      request(app).patch('/posts/1')
        .send({ data: { type: 'posts', id: 1 } })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(done);
    });

    it('PATCH /models/:id should return an 422 error if type key is not present', function (done) {
      request(app).patch('/posts/1')
        .send({
          data: {
            id: 1,
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .expect(422)
        .set('Content-Type', 'application/json')
        .end(done);
    });

    it('PATCH /models/:id should return an 422 error if id key is not present', function (done) {
      request(app).patch('/posts/1')
        .send({
          data: {
            type: 'posts',
            attributes: {
              title: 'my post',
              content: 'my post content'
            }
          }
        })
        .expect(422)
        .set('Content-Type', 'application/json')
        .end(done);
    });
  });
});
