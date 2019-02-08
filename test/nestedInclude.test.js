'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var ds, app, Post, Author, Comment

describe('nested include option', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })
    app.model(Post)

    Comment = ds.createModel('comment', {
      id: { type: Number, id: true },
      postId: Number,
      authorId: Number,
      title: String,
      comment: String
    })

    app.model(Comment)

    Author = ds.createModel('author', {
      id: { type: Number, id: true },
      name: String
    })

    app.model(Author)

    Post.hasMany(Comment, { as: 'comments', foreignKey: 'postId' })
    Comment.belongsTo(Author, { as: 'author', foreignKey: 'authorId' })
    Comment.settings.plural = 'comments'

    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  describe('include defined at model level', function () {
    beforeEach(function (done) {
      Post.create(
        {
          title: 'my post',
          content: 'my post content'
        },
        function (err, post) {
          expect(err).to.equal(null)
          Author.create(
            {
              name: 'Joe'
            },
            function (err, author) {
              expect(err).to.equal(null)
              post.comments.create(
                {
                  title: 'My comment',
                  comment: 'My comment text',
                  authorId: author.getId()
                },
                function (err) {
                  expect(err).to.equal(null)
                  post.comments.create(
                    {
                      title: 'My second comment',
                      comment: 'My second comment text',
                      authorId: author.getId()
                    },
                    done
                  )
                }
              )
            }
          )
        }
      )
    })

    describe('response', function () {
      it('should include author of comments', function (done) {
        request(app)
          .get('/posts/1?filter[include][comments]=author')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.included).to.be.an('array').of.length(3)
            res.body.included.sort((a, b) => a.type > b.type)
            expect(res.body.included[0].type).to.equal('authors')
            expect(res.body.included[1].type).to.equal('comments')
            expect(res.body.included[2].type).to.equal('comments')

            expect(res.body.included[1].relationships.author.data.id).to.equal(
              '1'
            )
            expect(res.body.included[2].relationships.author.data.id).to.equal(
              '1'
            )
            done()
          })
      })

      it('attributes of comments should not have relationship key', function (
        done
      ) {
        request(app)
          .get('/posts/1?filter[include][comments]=author')
          .end(function (err, res) {
            expect(err).to.equal(null)
            res.body.included.sort((a, b) => a.type > b.type)
            expect(res.body.included[1].attributes).to.not.include.key(
              'author'
            )
            done()
          })
      })
    })
  })
})
