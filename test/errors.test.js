var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post

describe('disabling loopback-component-jsonapi error handler', function () {
  it('should retain the default error handler', function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app, { handleErrors: false })

    request(app).get('/posts/100').end(function (err, res) {
      expect(err).to.equal(null)
      expect(res.body).to.have.keys('error')
      expect(res.body.error).to.have.keys('name', 'message', 'statusCode')
      done()
    })
  })
})

describe('loopback json api errors', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '' })
  })

  describe('headers', function () {
    it(
      "GET /models/100 (which doens't exist) should return JSON API header",
      function (done) {
        request(app)
          .get('/posts/100')
          .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
          .end(done)
      }
    )

    it(
      'POST /models should return JSON API header when type key not present error is thrown',
      function (done) {
        request(app)
          .post('/posts')
          .send({
            data: {
              attributes: { title: 'my post', content: 'my post content' }
            }
          })
          .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
          .set('Content-Type', 'application/json')
          .end(done)
      }
    )
  })

  describe('status codes', function () {
    it('GET /models/100 should return a 404 not found error', function (done) {
      request(app).get('/posts/100').expect(404).end(done)
    })

    it('GET /models/100 should return a 404 not found error', function (done) {
      request(app).get('/posts/100').end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body).to.have.keys('errors')
        expect(res.body.errors.length).to.equal(1)
        expect(res.body.errors[0]).to.deep.equal({
          status: 404,
          code: 'MODEL_NOT_FOUND',
          detail: 'Unknown "post" id "100".',
          source: '',
          title: 'Error'
        })
        done()
      })
    })

    it(
      'POST /models should return a 422 status code if type key is not present',
      function (done) {
        request(app)
          .post('/posts')
          .send({
            data: {
              attributes: { title: 'my post', content: 'my post content' }
            }
          })
          .expect(422)
          .set('Content-Type', 'application/json')
          .end(done)
      }
    )

    it(
      'POST /models should return a more specific 422 status code on the error object if type key is not present',
      function (done) {
        request(app)
          .post('/posts')
          .send({
            data: {
              attributes: { title: 'my post', content: 'my post content' }
            }
          })
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.have.keys('errors')
            expect(res.body.errors.length).to.equal(1)
            expect(res.body.errors[0]).to.deep.equal({
              status: 422,
              code: 'presence',
              detail: 'JSON API resource object must contain `data.type` property',
              source: '',
              title: 'ValidationError'
            })
            done()
          })
      }
    )

    it(
      'POST /models should return an 422 error if model title is not present',
      function (done) {
        Post.validatesPresenceOf('title')

        request(app)
          .post('/posts')
          .send({ data: { type: 'posts' } })
          .expect(422)
          .set('Content-Type', 'application/json')
          .end(done)
      }
    )

    it(
      'POST /models should return an 422 error on the error object if model title is not present',
      function (done) {
        Post.validatesPresenceOf('title')
        Post.validatesPresenceOf('content')

        request(app)
          .post('/posts')
          .send({ data: { type: 'posts' } })
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.have.keys('errors')
            expect(res.body.errors.length).to.equal(2)
            expect(res.body.errors[0]).to.deep.equal({
              status: 422,
              source: { pointer: 'data/attributes/title' },
              title: 'ValidationError',
              code: 'presence',
              detail: "can't be blank"
            })
            done()
          })
      }
    )
  })
})
