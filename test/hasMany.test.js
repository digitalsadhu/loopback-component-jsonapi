var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app, Post, Comment, Reply, ds

describe('loopback json api hasMany relationships', function () {
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
      title: String,
      comment: String
    })
    app.model(Comment)
    Post.hasMany(Comment, { as: 'comments', foreignKey: 'postId' })
    Comment.settings.plural = 'comments'

    Reply = ds.createModel('reply', {
      id: { type: Number, id: true },
      commentId: Number,
      content: String
    })
    Reply.settings.plural = 'replies'
    app.model(Reply)
    Comment.hasMany(Reply, { as: 'replies', foreignKey: 'commentId' })

    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  describe('Fetch a post with no comments', function (done) {
    beforeEach(function (done) {
      Post.create(
        {
          title: 'my post without comments',
          content: 'my post without comments content'
        },
        done
      )
    })

    describe('GET /posts/1/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/comments').expect(200).end(done)
      })

      it('should display an empty array keyed by `data`', function (done) {
        request(app).get('/posts/1/comments').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.be.an('object')
          expect(res.body.links).to.be.an('object')
          expect(res.body.links.self).to.match(/posts\/1\/comments/)
          expect(res.body.data).to.be.an('array')
          expect(res.body.data.length).to.equal(0)
          done()
        })
      })
    })

    describe('GET /posts/1/relationships/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app)
          .get('/posts/1/relationships/comments')
          .expect(200)
          .end(done)
      })

      it('should display an empty array keyed by `data`', function (done) {
        request(app)
          .get('/posts/1/relationships/comments')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.be.an('object')
            expect(res.body.links).to.be.an('object')
            expect(res.body.links.self).to.match(
              /posts\/1\/relationships\/comments/
            )
            expect(res.body.links.related).to.match(/posts\/1\/comments/)
            expect(res.body.data).to.be.an('array')
            expect(res.body.data.length).to.equal(0)
            done()
          })
      })
    })
  })

  describe('Fetch a post with a comment', function (done) {
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
                done
              )
            }
          )
        }
      )
    })

    describe('GET /posts/1/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/posts/1/comments').expect(200).end(done)
      })

      it('should display a single item array keyed by `data`', function (done) {
        request(app).get('/posts/1/comments').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.be.an('object')
          expect(res.body.links).to.be.an('object')
          expect(res.body.links.self).to.match(/posts\/1\/comments/)
          expect(res.body.data).to.be.an('array')
          expect(res.body.data.length).to.equal(2)
          expect(res.body.data[0].type).to.equal('comments')
          done()
        })
      })
    })

    describe('GET /posts/1/relationships/comments', function () {
      it('should return status code 200 OK', function (done) {
        request(app)
          .get('/posts/1/relationships/comments')
          .expect(200)
          .end(done)
      })

      it('should display a single item array keyed by `data`', function (done) {
        request(app)
          .get('/posts/1/relationships/comments')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.be.an('object')
            expect(res.body.links).to.be.an('object')
            expect(res.body.links.self).to.match(
              /posts\/1\/relationships\/comments/
            )
            expect(res.body.links.related).to.match(/posts\/1\/comments/)
            expect(res.body.data).to.be.an('array')
            expect(res.body.data.length).to.equal(2)
            expect(res.body.data[0]).to.deep.equal({
              type: 'comments',
              id: '1'
            })
            done()
          })
      })
    })

    describe(
      'embedded relationship information in collections (GET /:collection)',
      function () {
        it(
          'should return comments relationship link in relationships object',
          function (done) {
            request(app).get('/posts').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data[0].relationships).to.be.an('object')
              expect(res.body.data[0].relationships.comments).to.be.an(
                'object'
              )
              expect(res.body.data[0].relationships.comments.links).to.be.an(
                'object'
              )
              expect(
                res.body.data[0].relationships.comments.links.related
              ).to.match(/posts\/1\/comments/)
              done()
            })
          }
        )

        it(
          'should not include data key relationships object if `include` is not specified',
          function (done) {
            request(app).get('/posts').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data[0].relationships.comments).not.to.have.key(
                'data'
              )
              done()
            })
          }
        )

        it(
          'should return included data as a compound document using key "included"',
          function (done) {
            request(app)
              .get('/posts?filter[include]=comments')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.data[0].relationships).to.be.an('object')
                expect(res.body.data[0].relationships.comments).to.be.an(
                  'object'
                )
                expect(
                  res.body.data[0].relationships.comments.data
                ).to.deep.equal([
                  {
                    type: 'comments',
                    id: '1'
                  },
                  {
                    type: 'comments',
                    id: '2'
                  }
                ])
                expect(res.body.data[0].relationships.comments.links).to.be.an(
                  'object'
                )
                expect(
                  res.body.data[0].relationships.comments.links.related
                ).to.match(/posts\/1\/comments/)
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(2)
                expect(res.body.included[0]).to.have.all.keys(
                  'type',
                  'id',
                  'attributes',
                  'relationships'
                )
                expect(res.body.included[0].type).to.equal('comments')
                expect(res.body.included[0].id).to.equal('1')
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified.',
          function (done) {
            request(app)
              .get('/posts?filter[include]=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it(
          'should allow specifying `include` in the url to meet JSON API spec. eg. include=comments',
          function (done) {
            request(app).get('/posts?include=comments').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.included).to.be.an('array')
              expect(res.body.included.length).to.equal(2)
              expect(res.body.data[0].attributes).to.not.have.keys('comments')
              expect(res.body.included[0]).to.deep.equal({
                id: '1',
                type: 'comments',
                attributes: {
                  title: 'My comment',
                  comment: 'My comment text'
                },
                relationships: {
                  replies: {
                    links: {
                      related: res.body.included[0].relationships.replies.links.related
                    }
                  }
                }
              })
              expect(res.body.included[1]).to.deep.equal({
                id: '2',
                type: 'comments',
                attributes: {
                  title: 'My second comment',
                  comment: 'My second comment text'
                },
                relationships: {
                  replies: {
                    links: {
                      related: res.body.included[1].relationships.replies.links.related
                    }
                  }
                }
              })
              done()
            })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.',
          function (done) {
            request(app)
              .get('/posts?include=doesnotexist')
              .expect(400)
              .end(done)
          }
        )
      }
    )

    describe(
      'embedded relationship information for individual resource GET /:collection/:id',
      function () {
        it(
          'should return comments relationship link in relationships object',
          function (done) {
            request(app).get('/posts/1').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data.relationships).to.be.an('object')
              expect(res.body.data.relationships.comments).to.be.an('object')
              expect(res.body.data.relationships.comments.links).to.be.an(
                'object'
              )
              expect(
                res.body.data.relationships.comments.links.related
              ).to.match(/posts\/1\/comments/)
              done()
            })
          }
        )

        it(
          'should not include data key relationships object if `include` is not specified',
          function (done) {
            request(app).get('/posts/1').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data.relationships.comments).not.to.have.key(
                'data'
              )
              done()
            })
          }
        )

        it(
          'should return included data as a compound document using key "included"',
          function (done) {
            request(app)
              .get('/posts/1?filter[include]=comments')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.data.relationships).to.be.an('object')
                expect(res.body.data.relationships.comments).to.be.an('object')
                expect(
                  res.body.data.relationships.comments.data
                ).to.deep.equal([
                  {
                    type: 'comments',
                    id: '1'
                  },
                  {
                    type: 'comments',
                    id: '2'
                  }
                ])
                expect(res.body.data.relationships.comments.links).to.be.an(
                  'object'
                )
                expect(
                  res.body.data.relationships.comments.links.related
                ).to.match(/posts\/1\/comments/)
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(2)
                expect(res.body.included[0]).to.have.all.keys(
                  'type',
                  'id',
                  'attributes',
                  'relationships'
                )
                expect(res.body.included[0].type).to.equal('comments')
                expect(res.body.included[0].id).to.equal('1')
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified.',
          function (done) {
            request(app)
              .get('/posts/1?filter[include]=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it(
          'should allow specifying `include` in the url to meet JSON API spec. eg. include=comments',
          function (done) {
            request(app)
              .get('/posts/1?include=comments')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(2)
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.',
          function (done) {
            request(app)
              .get('/posts/1?include=doesnotexist')
              .expect(400)
              .end(done)
          }
        )
      }
    )
  })

  describe('Nested relationships', function () {
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
            function (err, comment) {
              expect(err).to.equal(null)
              comment.replies.create(
                {
                  content: 'My reply'
                },
                done
              )
            }
          )
        }
      )
    })

    it(
      'should return relationship information when getting a nested model',
      function (done) {
        request(app).get('/posts/1/comments').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.not.have.key('errors')
          expect(res.body.links).to.be.an('object')
          expect(res.body.data[0].relationships.replies).to.be.an('object')
          expect(res.body.data[0].relationships.replies.links.related).to.match(
            /comments\/1\/replies/
          )
          done()
        })
      }
    )
  })
})
