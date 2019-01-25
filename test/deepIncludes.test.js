'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app, Post, Group, Comment, Author, Rating, ds

describe('deep includes test', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')

    Group = ds.createModel('group', {
      title: String
    })
    Author = ds.createModel('author', {
      firstName: String,
      lastName: String
    })
    Post = ds.createModel('post', {
      title: String,
      content: String
    })
    Comment = ds.createModel('comment', {
      title: String,
      comment: String
    })
    Rating = ds.createModel('rating', {
      rating: Number
    })

    Post.settings.plural = 'posts'
    Author.settings.plural = 'authors'
    Comment.settings.plural = 'comments'

    app.model(Group)
    app.model(Author)
    app.model(Post)
    app.model(Comment)
    app.model(Rating)

    Group.hasMany(Author)
    Author.belongsTo(Group)
    Author.hasMany(Post)
    Author.hasOne(Rating)
    Post.hasMany(Comment)
    Post.belongsTo(Author)
    Comment.belongsTo(Post)
    Rating.belongsTo(Author)

    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  describe('Deep nested includes test', function (done) {
    beforeEach(function (done) {
      Group.create({ title: 'art' }, function (err, group) {
        expect(err).to.equal(null)
        group.authors.create({ firstName: 'Joe', lastName: 'Shmoe' }, function (
          err,
          author
        ) {
          expect(err).to.equal(null)
          author.rating.create({ rating: 146 })
          author.posts.create(
            { title: 'my post', content: 'my post content' },
            function (err, post) {
              expect(err).to.equal(null)
              post.comments.create(
                [
                  { title: 'My comment', comment: 'My comment text' },
                  {
                    title: 'My second comment',
                    comment: 'My second comment text'
                  }
                ],
                done
              )
            }
          )
        })
      })
    })

    it('should return correct response for one-level nested includes', function (
      done
    ) {
      request(app)
        .get('/groups/1/?include=authors.posts')
        .expect(200)
        .end(function (err, res) {
          var data = res.body.data
          expect(err).to.equal(null)
          expect(data.id).to.equal('1')
          expect(data.type).to.equal('groups')
          expect(data.relationships).to.be.a('object')
          expect(data.relationships.authors).to.be.a('object')

          data.relationships.authors.data.forEach(post => {
            expect(post.id).to.equal('1')
            expect(post.type).to.equal('authors')
          })
          expect(data.attributes).to.deep.equal({ title: 'art' })
          const included = res.body.included
          expect(included).to.be.an('array')
          expect(included.length).to.equal(2)

          included.forEach(item => {
            expect(item.type).to.be.oneOf(['posts', 'authors'])

            if (item.type === 'authors') {
              expect(item.relationships).to.has.property('posts')
              expect(item.relationships.posts.data).to.be.an('array')
              item.relationships.posts.data.forEach(post => {
                expect(post).to.has.property('id')
                expect(post.type).to.equal('posts')
              })
            }
          })
          done()
        })
    })
    it(
      'should return correct response for simple and one level nested includes',
      function (done) {
        request(app)
          .get('/authors/1/?include=posts.comments,rating')
          .expect(200)
          .end(function (err, res) {
            var data = res.body.data
            expect(err).to.equal(null)
            expect(data.id).to.equal('1')
            expect(data.type).to.equal('authors')
            expect(data.relationships).to.be.a('object')
            expect(data.relationships.posts).to.be.a('object')

            data.relationships.posts.data.forEach(post => {
              expect(post.id).to.equal('1')
              expect(post.type).to.equal('posts')
            })

            expect(data.relationships.rating.data.id).to.equal('1')
            expect(data.relationships.rating.data.type).to.equal('ratings')

            expect(data.attributes).to.deep.equal({
              firstName: 'Joe',
              lastName: 'Shmoe'
            })
            const included = res.body.included
            expect(included).to.be.an('array')
            expect(included.length).to.equal(4)

            included.forEach(item => {
              expect(item.type).to.be.oneOf(['posts', 'comments', 'ratings'])

              if (item.type === 'posts') {
                expect(item.relationships).to.has.property('comments')
                expect(item.relationships.comments.data).to.be.an('array')
                item.relationships.comments.data.forEach(comment => {
                  expect(comment).to.has.property('id')
                  expect(comment.type).to.equal('comments')
                })
              }
            })
            done()
          })
      }
    )
    it('should return correct response for two-level nested includes', function (
      done
    ) {
      request(app)
        .get('/groups/1/?include=authors.posts.comments')
        .expect(200)
        .end(function (err, res) {
          var data = res.body.data
          expect(err).to.equal(null)
          expect(data.id).to.equal('1')
          expect(data.type).to.equal('groups')
          expect(data.relationships).to.be.a('object')
          expect(data.relationships.authors).to.be.a('object')
          expect(data.relationships.authors.data.length).to.equal(1)
          data.relationships.authors.data.forEach(post => {
            expect(post.id).to.equal('1')
            expect(post.type).to.equal('authors')
          })
          expect(data.attributes).to.deep.equal({ title: 'art' })
          const included = res.body.included
          expect(included).to.be.an('array')

          const commentsIncluded = included.filter(
            incl => incl.type === 'comments'
          )
          const postsIncluded = included.filter(incl => incl.type === 'posts')
          const authorsIncluded = included.filter(
            incl => incl.type === 'authors'
          )

          expect(commentsIncluded.length).to.equal(2)
          expect(postsIncluded.length).to.equal(1)
          expect(authorsIncluded.length).to.equal(1)

          included.forEach(item => {
            expect(item).to.has.property('id')
            expect(item.type).to.be.oneOf(['posts', 'authors', 'comments'])

            if (item.type === 'authors') {
              expect(item.relationships).to.has.property('posts')
              expect(item.relationships.posts.data).to.be.an('array')
              item.relationships.posts.data.forEach(post => {
                expect(post).to.has.property('id')
                expect(post.type).to.equal('posts')
              })
            }

            if (item.type === 'posts') {
              expect(item.relationships).to.has.property('comments')
              expect(item.relationships.comments.data).to.be.an('array')
              item.relationships.comments.data.forEach(post => {
                expect(post).to.has.property('id')
                expect(post.type).to.equal('comments')
              })
            }
          })
          done()
        })
    })
  })
})
