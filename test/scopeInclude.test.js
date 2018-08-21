'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var ds, app, Post, Author, Comment, Category

describe('include option', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel(
      'post',
      {
        id: { type: Number, id: true },
        title: String,
        content: String
      },
      {
        scope: {
          include: 'comments'
        }
      }
    )
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

    Category = ds.createModel('category', {
      id: { type: Number, id: true },
      name: String
    })

    app.model(Author)

    Post.hasMany(Comment, { as: 'comments', foreignKey: 'postId' })
    Post.belongsTo(Author, { as: 'author', foreignKey: 'authorId' })
    Post.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' })
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
          post.comments.create(
            {
              title: 'My comment',
              comment: 'My comment text'
            },
            function () {
              post.comments.create(
                {
                  title: 'My second comment',
                  comment: 'My second comment text'
                },
                function () {
                  post.author.create(
                    {
                      name: 'Joe'
                    },
                    function () {
                      post.category.create(
                        {
                          name: 'Programming'
                        },
                        done
                      )
                    }
                  )
                }
              )
            }
          )
        }
      )
    })

    describe('response', function () {
      it('should have key `included`', function (done) {
        request(app).get('/posts/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.included).to.be.an('array')
          done()
        })
      })

      it('attributes should not have relationship key', function (done) {
        request(app).get('/posts/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.attributes).to.not.include.key('comments')
          done()
        })
      })

      it('with include parameter should have both models', function (done) {
        request(app)
          .get('/posts/1?filter[include]=author')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.included.length).equal(3)

            var types = res.body.included.map(r => r.type)
            types.sort()
            expect(types).to.deep.equal(['authors', 'comments', 'comments'])

            done()
          })
      })
      it('should include comments', function (done) {
        request(app)
          .get('/posts/1?filter={"include":["comments"]}')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.included.length).equal(2)
            expect(res.body.included[0].type).equal('comments')
            expect(res.body.included[1].type).equal('comments')
            done()
          })
      })
      it('should include categories with empty attributes object', function (
        done
      ) {
        request(app)
          .get(
            '/posts/1?filter={"include":[{"relation":"category", "scope": {"fields": ["id"]}}]}'
          )
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.included.length).equal(3)

            var hasCategory = false
            res.body.included.forEach(r => {
              if (r.type === 'categories') {
                hasCategory = true
                expect(r.attributes).to.include({})
              }
            })

            expect(hasCategory).to.equal(true, 'categories to be present')

            done()
          })
      })
    })
  })
})
