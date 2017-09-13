var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post
var Comment

describe('hook in to modify deserialization process', function () {
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

    Comment.belongsTo(Post)
    Post.hasMany(Comment)

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

  describe('before deserialization', function () {
    beforeEach(function () {
      Post.beforeJsonApiDeserialize = function (options, cb) {
        options.data.data.attributes.title = 'my post 2'
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.beforeJsonApiDeserialize
    })
    it('should allow options to be modified before serialization', function (
      done
    ) {
      request(app)
        .post('/posts')
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
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes.title).to.equal('my post 2')
          done()
        })
    })
    it(
      'should not affect models without a beforeJsonApiDeserialize method',
      function (done) {
        request(app)
          .post('/comments')
          .send({
            data: {
              type: 'comments',
              attributes: {
                title: 'my comment title',
                comment: 'my comment content'
              }
            }
          })
          .expect(201)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.attributes.title).to.equal('my comment title')
            done()
          })
      }
    )
  })

  describe('before deserialization manipulating relationships', function () {
    beforeEach(function () {
      Post.beforeJsonApiDeserialize = function (options, cb) {
        options.data.data.relationships = {
          comments: {
            data: [
              {
                type: 'comments',
                id: '1'
              }
            ]
          }
        }
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.beforeJsonApiDeserialize
    })
    it(
      'should save relationships manipulated in beforeJsonApiDeserialize',
      function (done) {
        request(app)
          .post('/posts')
          .send({
            data: {
              type: 'posts',
              attributes: {
                title: 'my post',
                content: 'my post content'
              },
              relationships: { fake: {} }
            }
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .expect(201)
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(null)
              expect(comment.postId).to.equal(2)
              done()
            })
          })
      }
    )
  })

  describe('after deserialization', function () {
    beforeEach(function () {
      Post.afterJsonApiDeserialize = function (options, cb) {
        options.result.title = 'my post 3'
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.afterJsonApiDeserialize
    })
    it('should allow options to be modified after serialization', function (
      done
    ) {
      request(app)
        .post('/posts')
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
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes.title).to.equal('my post 3')
          done()
        })
    })
    it(
      'should not affect models without a afterJsonApiDeserialize method',
      function (done) {
        request(app)
          .post('/comments')
          .send({
            data: {
              type: 'comments',
              attributes: {
                title: 'my comment title',
                comment: 'my comment content'
              }
            }
          })
          .expect(201)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.attributes.title).to.equal('my comment title')
            done()
          })
      }
    )
  })

  describe('custom deserialization', function () {
    beforeEach(function () {
      Post.jsonApiDeserialize = function (options, cb) {
        options.result = options.data.data.attributes
        options.result.title = 'super dooper'
        cb(null, options)
      }
    })
    afterEach(function () {
      delete Post.jsonApiDeserialize
    })
    it('should allow custom deserialization', function (done) {
      request(app)
        .post('/posts')
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
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes.title).to.equal('super dooper')
          done()
        })
    })
    it('should not affect models without a jsonApiDeserialize method', function (
      done
    ) {
      request(app)
        .post('/comments')
        .send({
          data: {
            type: 'comments',
            attributes: {
              title: 'my comment title',
              comment: 'my comment content'
            }
          }
        })
        .expect(201)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes.title).to.equal('my comment title')
          done()
        })
    })
  })
})
