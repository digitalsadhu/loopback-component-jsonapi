'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post

describe('loopback json api component update method', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: {
        type: Number,
        id: true
      },
      title: String,
      content: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app)
    Post.create(
      {
        title: 'my post',
        content: 'my post content'
      },
      done
    )
  })

  describe('Headers', function () {
    it(
      'PATCH /models/:id should have the JSON API Content-Type header set on response',
      function (done) {
        // TODO: superagent/supertest breaks when trying to use JSON API Content-Type header
        // waiting on a fix
        // see https://github.com/visionmedia/superagent/issues/753
        // using Content-Type: application/json in the mean time.
        // Have tested correct header using curl and all is well
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
        //   .end(done)
        done()
      }
    )
  })

  describe('Status codes', function () {
    it('PATCH /models/:id should return a 200 status code', function (done) {
      request(app)
        .patch('/posts/1')
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
        .end(done)
    })

    it(
      'PATCH /models/:id should return 404 when attempting to edit non existing resource',
      function (done) {
        request(app)
          .patch('/posts/10')
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
          .end(done)
      }
    )
  })

  describe('Links', function () {
    it('should produce resource level self links', function (done) {
      request(app)
        .patch('/posts/1')
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
          expect(err).to.equal(null)
          expect(res.body.data.links.self).to.match(
            /http:\/\/127\.0\.0\.1.*\/posts\/1/
          )
          done()
        })
    })
  })

  describe('Updating a resource using PATCH', function () {
    it('PATCH /models/:id should return a correct JSON API response', function (
      done
    ) {
      request(app)
        .patch('/posts/1')
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
          expect(err).to.equal(null)
          expect(res.body.data.id).to.equal('1')
          expect(res.body.data.type).to.equal('posts')
          expect(res.body.data.attributes.title).to.equal(
            'my post title changed'
          )
          expect(res.body.data.attributes.content).to.equal(
            'my post content changed'
          )
          done()
        })
    })

    it(
      "PATCH /models/:id if property in `attributes` is not present, it should not be considered null or change from it's original value",
      function (done) {
        request(app)
          .patch('/posts/1')
          .send({
            data: {
              type: 'posts',
              id: 1,
              attributes: {
                content: 'only changing content, not title'
              }
            }
          })
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.id).to.equal('1')
            expect(res.body.data.type).to.equal('posts')
            expect(res.body.data.attributes.title).to.equal('my post')
            expect(res.body.data.attributes.content).to.equal(
              'only changing content, not title'
            )
            done()
          })
      }
    )
  })

  describe('Errors', function () {
    it(
      'PATCH /models/:id with empty `attributes` should not return an error and should not modify existing attributes',
      function (done) {
        request(app)
          .patch('/posts/1')
          .send({ data: { type: 'posts', id: 1, attributes: {} } })
          .set('Content-Type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.id).to.equal('1')
            expect(res.body.data.type).to.equal('posts')
            expect(res.body.data.attributes.title).to.equal('my post')
            expect(res.body.data.attributes.content).to.equal(
              'my post content'
            )
            done()
          })
      }
    )

    it(
      'PATCH /models/:id with no `attributes` should not return an error and should not modify existing attributes',
      function (done) {
        request(app)
          .patch('/posts/1')
          .send({
            data: {
              type: 'posts',
              id: 1
            }
          })
          .set('Content-Type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.id).to.equal('1')
            expect(res.body.data.type).to.equal('posts')
            expect(res.body.data.attributes.title).to.equal('my post')
            expect(res.body.data.attributes.content).to.equal(
              'my post content'
            )
            done()
          })
      }
    )

    it(
      'PATCH /models/:id should return an 422 error if `type` key is not present and include an errors array',
      function (done) {
        request(app)
          .patch('/posts/1')
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
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.have.keys('errors')
            expect(res.body.errors).to.be.a('array')
            expect(res.body.errors.length).to.equal(1)
            expect(res.body.errors[0].status).to.equal(422)
            expect(res.body.errors[0].title).to.equal('ValidationError')
            expect(res.body.errors[0].detail).to.equal(
              'JSON API resource object must contain `data.type` property'
            )
            done()
          })
      }
    )

    it(
      'PATCH /models/:id should return an 422 error if `id` key is not present and include an errors array',
      function (done) {
        request(app)
          .patch('/posts/1')
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
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.have.keys('errors')
            expect(res.body.errors).to.be.a('array')
            expect(res.body.errors.length).to.equal(1)
            expect(res.body.errors[0].status).to.equal(422)
            expect(res.body.errors[0].title).to.equal('ValidationError')
            expect(res.body.errors[0].detail).to.equal(
              'JSON API resource object must contain `data.id` property'
            )
            done()
          })
      }
    )
  })
})

describe('non standard primary key naming', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      customId: { type: Number, id: true, generated: true },
      title: String
    })
    app.model(Post)
    app.use(loopback.rest())
    JSONAPIComponent(app)
    Post.create({ title: 'my post' }, done)
  })

  it('should dynamically handle primary key', function (done) {
    request(app)
      .patch('/posts/1')
      .send({
        data: {
          id: 1,
          type: 'posts',
          attributes: { title: 'my post 2' }
        }
      })
      .expect(200)
      .end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data.id).to.equal('1')
        expect(res.body.data.attributes.title).to.equal('my post 2')
        expect(res.body.data.links.self).to.match(
          /http:\/\/127\.0\.0\.1.*\/posts\/1/
        )
        done()
      })
  })
})
