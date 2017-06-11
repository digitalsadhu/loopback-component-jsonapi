var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post
var Comment

describe('hook in to modify serialization process', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')

    Post = ds.createModel('post', {
      title: String,
      content: String,
      other: String
    })
    app.model(Post)

    Comment = ds.createModel('comment', {
      title: String,
      comment: String,
      other: String
    })
    app.model(Comment)

    app.use(loopback.rest())

    Post.create(
      { title: 'my post', content: 'my post content', other: 'my post other' },
      function () {
        Comment.create(
          {
            title: 'my comment title',
            comment: 'my comment',
            other: 'comment other'
          },
          done
        )
      }
    )

    JSONAPIComponent(app)
  })

  describe('before serialization', function () {
    beforeEach(function () {
      Post.beforeJsonApiSerialize = function (options, cb) {
        options.type = 'notPosts'
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.beforeJsonApiSerialize
    })
    it('should allow options to be modified before serialization', function (
      done
    ) {
      request(app).get('/posts').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0].type).to.equal('notPosts')
        done()
      })
    })
    it(
      'should not affect models without a beforeJsonApiSerialize method',
      function (done) {
        request(app).get('/comments').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data[0].type).to.equal('comments')
          done()
        })
      }
    )
  })

  describe('after serialization', function () {
    beforeEach(function () {
      Post.afterJsonApiSerialize = function (options, cb) {
        options.results.data = options.results.data.map(function (result) {
          result.attributes.testing = true
          return result
        })
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.afterJsonApiSerialize
    })
    it('should allow results to be modified after serialization', function (
      done
    ) {
      request(app).get('/posts').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0].attributes.testing).to.equal(true)
        done()
      })
    })
    it(
      'should not affect models without an afterJsonApiSerialize method',
      function (done) {
        request(app).get('/comments').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data[0].attributes.testing).to.equal(undefined)
          done()
        })
      }
    )
  })

  describe('custom serialization', function () {
    beforeEach(function () {
      Post.jsonApiSerialize = function (options, cb) {
        options.results = options.results.map(function (result) {
          return result.title
        })
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.jsonApiSerialize
    })
    it('should allow a custom serializer to be defined for a model', function (
      done
    ) {
      request(app).get('/posts').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body[0]).to.equal('my post')
        done()
      })
    })
    it('should not affect models without a jsonApiSerialize method', function (
      done
    ) {
      request(app).get('/comments').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0].attributes.title).to.equal('my comment title')
        done()
      })
    })
  })
})
