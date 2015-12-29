var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var Post;
var Person;
var ds;

describe('loopback json api hasOne relationships', function () {
  beforeEach(function () {
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
            expect(err).to.equal(null);
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
            expect(err).to.equal(null);
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
        expect(err).to.equal(null);
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
            expect(err).to.equal(null);
            expect(res.body).to.be.an('object');
            expect(res.body.links).to.be.an('object');
            expect(res.body.links.self).to.match(/posts\/1\/author/);
            expect(res.body.data.attributes).to.deep.equal({
              name: 'Bob Jones'
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
            expect(err).to.equal(null);
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

    describe('embedded relationship information in collections (GET /:collection)', function () {
      it('should return author relationship link in relationships object', function (done) {
        request(app).get('/posts')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data[0].relationships).to.be.an('object');
            expect(res.body.data[0].relationships.author).to.be.an('object');
            expect(res.body.data[0].relationships.author.links).to.be.an('object');
            expect(res.body.data[0].relationships.author.links.related).to.match(/posts\/1\/author/);
            done();
          });
      });

      it('should not include data key relationships object if `include` is not specified', function (done) {
        request(app).get('/posts')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data[0].relationships.author).not.to.have.key('data');
            done();
          });
      });

      it('should return included data as a compound document using key "included"', function (done) {
        request(app).get('/posts?filter[include]=author')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data[0].relationships).to.be.an('object');
            expect(res.body.data[0].relationships.author).to.be.an('object');
            expect(res.body.data[0].relationships.author.data).to.deep.equal({
              type: 'people',
              id: '1'
            });
            expect(res.body.data[0].relationships.author.links).to.be.an('object');
            expect(res.body.data[0].relationships.author.links.related).to.match(/posts\/1\/author/);
            expect(res.body.included).to.be.an('array');
            expect(res.body.included.length).to.equal(1);
            expect(res.body.included[0]).to.have.all.keys('type', 'id', 'attributes');
            expect(res.body.included[0].type).to.equal('people');
            expect(res.body.included[0].id).to.equal('1');
            done();
          });
      });

      it.skip('should return a 400 Bad Request error if a non existent relationship is specified.', function (done) {
        request(app).get('/posts?filter={"include":"doesnotexist"}')
          .expect(400)
          .end(done);
      });

      it('should allow specifying `include` in the url to meet JSON API spec. eg. include=author', function (done) {
        request(app).get('/posts?include=author')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.included).to.be.an('array');
            expect(res.body.included.length).to.equal(1);
            expect(res.body.included[0]).to.deep.equal({
              id: '1',
              type: 'people',
              attributes: {
                postId: 1,
                name: 'Bob Jones'
              }
            });
            done();
          });
      });

      it.skip('should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.', function (done) {
        request(app).get('/posts?include=doesnotexist')
          .expect(400)
          .end(done);
      });
    });

    describe('embedded relationship information for individual resource GET /:collection/:id', function () {
      it('should return author relationship link in relationships object', function (done) {
        request(app).get('/posts/1')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data.relationships).to.be.an('object');
            expect(res.body.data.relationships.author).to.be.an('object');
            expect(res.body.data.relationships.author.links).to.be.an('object');
            expect(res.body.data.relationships.author.links.related).to.match(/posts\/1\/author/);
            done();
          });
      });

      it('should not include data key relationships object if `include` is not specified', function (done) {
        request(app).get('/posts/1')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data.relationships.author).not.to.have.key('data');
            done();
          });
      });

      it('should return included data as a compound document using key "included"', function (done) {
        request(app).get('/posts/1?filter[include]=author')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.data.relationships).to.be.an('object');
            expect(res.body.data.relationships.author).to.be.an('object');
            expect(res.body.data.relationships.author.data).to.deep.equal({
              type: 'people',
              id: '1'
            });
            expect(res.body.data.relationships.author.links).to.be.an('object');
            expect(res.body.data.relationships.author.links.related).to.match(/posts\/1\/author/);
            expect(res.body.included).to.be.an('array');
            expect(res.body.included.length).to.equal(1);
            expect(res.body.included[0]).to.have.all.keys('type', 'id', 'attributes');
            expect(res.body.included[0].type).to.equal('people');
            expect(res.body.included[0].id).to.equal('1');
            done();
          });
      });

      it.skip('should return a 400 Bad Request error if a non existent relationship is specified.', function (done) {
        request(app).get('/posts/1?filter={"include":"doesnotexist"}')
          .expect(400)
          .end(done);
      });

      it('should allow specifying `include` in the url to meet JSON API spec. eg. include=author', function (done) {
        request(app).get('/posts/1?include=author')
          .end(function (err, res) {
            expect(err).to.equal(null);
            expect(res.body.included).to.be.an('array');
            expect(res.body.included.length).to.equal(1);
            done();
          });
      });

      it.skip('should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.', function (done) {
        request(app).get('/posts/1?include=doesnotexist')
          .expect(400)
          .end(done);
      });
    });

  });
});
