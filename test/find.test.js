var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post

describe('loopback json api component find methods', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('Headers', function () {
    it('GET /models should have the JSON API Content-Type header set on collection responses', function (done) {
      request(app).get('/posts')
        .expect(200)
        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
        .end(done)
    })

    it('GET /models/:id should have the JSON API Content-Type header set on individual resource responses', function (done) {
      request(app).get('/posts/1')
        .expect(404)
        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
        .end(done)
    })
  })

  describe('Relationship objects', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, function () {
        Post.create({
          title: 'my post 2',
          content: 'my post content 2'
        }, done)
      })
    })

    it('should not be present when no relationships have been defined on a collection', function (done) {
      request(app).get('/posts')
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data[0]).not.to.have.all.keys('relationships')
          done()
        })
    })

    it('should not be present when no relationships have been defined on an individual resource', function (done) {
      request(app).get('/posts/1')
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data).not.to.have.all.keys('relationships')
          done()
        })
    })
  })

  describe('Self links', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, function () {
        Post.create({
          title: 'my post 2',
          content: 'my post content 2'
        }, function () {
          Post.create({
            title: 'my post 3',
            content: 'my post content 3'
          }, done)
        })
      })
    })

    // TODO: see https://github.com/digitalsadhu/loopback-component-jsonapi/issues/11
    it('GET /posts should produce top level self links', function (done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts$/)
          done()
        })
    })

    it('GET /posts/1 should produce resource level self links', function (done) {
      request(app).get('/posts/1')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts\/1$/)
          done()
        })
    })

    it('GET /posts/2 should produce correct resource level self links for individual resources', function (done) {
      request(app).get('/posts/2')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts\/2$/)
          done()
        })
    })

    it('GET /posts should produce correct resource level self links for collections', function (done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          var index = 1
          expect(err).to.equal(null)
          expect(res.body.data).to.be.a('array')
          expect(res.body.links.self).to.match(/http:\/\/127\.0\.0\.1.*\/posts$/)

          res.body.data.forEach(function (resource) {
            expect(resource.links.self).to.match(new RegExp('^http://127.0.0.1.*/posts/' + index))
            index++
          })

          // Make sure we have tested all 3
          expect(index - 1).to.equal(3)
          done()
        })
    })
  })

  describe('Empty responses', function () {
    it('GET /models should return an empty JSON API resource object when there are no results', function (done) {
      request(app).get('/posts')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.be.an('object')
          expect(res.body.links).to.be.an('object')
          // expect(res.body.links.self).to.match(/^http:\/\/127.0.0.1:.*\/api\/posts/)
          expect(res.body.data).to.be.an('array')
          expect(res.body.data.length).to.equal(0)
          done()
        })
    })

    it('GET model/:id should return a general 404 when there are no results', function (done) {
      request(app).get('/posts/1')
        .expect(404)
        .end(done)
    })
  })

  describe('Non-empty reponses', function () {
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
          expect(err).to.equal(null)
          expect(res.body).to.have.all.keys('links', 'data')
          expect(res.body.links).to.have.all.keys('self')
          expect(res.body.data).to.be.an('array')
          expect(res.body.data.length).to.equal(1)
          expect(res.body.data[0]).to.have.all.keys('id', 'type', 'attributes', 'links')
          expect(res.body.data[0].id).to.equal('1')
          expect(res.body.data[0].type).to.equal('posts')
          expect(res.body.data[0].attributes).to.have.all.keys('title', 'content')
          expect(res.body.data[0].attributes).to.not.have.keys('id')
          done()
        })
    })

    it('GET /models/:id should return a correct JSON API response', function (done) {
      request(app).get('/posts/1')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.have.all.keys('links', 'data')
          expect(res.body.links).to.have.all.keys('self')
          expect(res.body.data).to.have.all.keys('id', 'type', 'attributes', 'links')
          expect(res.body.data.id).to.equal('1')
          expect(res.body.data.type).to.equal('posts')
          expect(res.body.data.attributes).to.have.all.keys('title', 'content')
          expect(res.body.data.attributes).to.not.have.keys('id')
          done()
        })
    })
  })

  describe('Errors', function () {
    it('GET /models/doesnt/exist should return a general 404 error', function (done) {
      request(app).get('/posts/doesnt/exist')
        .expect(404)
        .end(done)
    })
  })

  describe('Filtering should still be intact', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'deer can jump',
        content: 'deer can jump really high in their natural habitat'
      }, function () {
        Post.create({
          title: 'pigs dont fly',
          content: "contrary to the myth, pigs don't fly!"
        }, function () {
          Post.create({
            title: 'unicorns come from rainbows',
            content: 'at the end of a rainbow may be a pot of gold, but also a mythical unicorn'
          }, done)
        })
      })
    })

    it('should filter only one', function (done) {
      request(app)
        .get('/posts?filter[where][title]=deer+can+jump')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.length).to.equal(1)
          done()
        })
    })

    it('should filter two', function (done) {
      request(app)
        .get('/posts?filter[where][content][like]=myth')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.length).to.equal(2)
          done()
        })
    })
  })
})

describe('non standard primary key naming', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      customId: {type: Number, id: true, generated: true},
      title: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app)
    Post.create({title: 'my post'}, done)
  })

  it('should dynamically handle primary key', function (done) {
    request(app)
      .get('/posts')
      .expect(200)
      .end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data.length).to.equal(1)
        expect(res.body.data[0].id).to.equal('1')
        done()
      })
  })
})
