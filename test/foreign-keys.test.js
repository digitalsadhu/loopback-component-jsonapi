'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post
var Comment

describe.skip('foreign key configuration', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')

    Post = ds.createModel('post', { title: String })
    app.model(Post)

    Comment = ds.createModel('comment', { comment: String })
    app.model(Comment)

    Comment.belongsTo(Post)
    Post.hasMany(Comment)

    app.use(loopback.rest())

    Post.create({ title: 'my post' }, function (err, post) {
      if (err) throw err
      post.comments.create({ comment: 'my comment' }, done)
    })
  })

  describe(
    'by default, foreign keys are not exposed through the api',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app)
      })
      it('should remove foreign keys from model before output', function (done) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.not.include.key('postId')
          done()
        })
      })
    }
  )

  describe(
    'configuring component to always expose foreign keys through the api',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app, {
          foreignKeys: true
        })
      })
      it('should not remove foreign keys from models before output', function (
        done
      ) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.include.key('postId')
          done()
        })
      })
    }
  )

  describe(
    'configuring component to expose foreign keys for post model through the api',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app, {
          foreignKeys: [{ model: 'post' }]
        })
      })
      it('should not expose postId on comment model', function (done) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.not.include.key('postId')
          done()
        })
      })
    }
  )

  describe(
    'configuring component to expose foreign keys for comment model through the api',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app, {
          foreignKeys: [{ model: 'comment' }]
        })
      })
      it('should expose postId on comment model', function (done) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.include.key('postId')
          done()
        })
      })
    }
  )

  describe(
    'configuring component to expose foreign keys for comment model method findById through the api',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app, {
          foreignKeys: [{ model: 'comment', method: 'findById' }]
        })
      })
      it('should not expose foreign keys in find all', function (done) {
        request(app).get('/comments').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data[0].attributes).to.not.include.key('postId')
          done()
        })
      })
      it('should expose foreign keys in find', function (done) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.include.key('postId')
          done()
        })
      })
    }
  )
})
