var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post
var Comment
var ds

describe('loopback json api belongsTo relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })
    Post.settings.plural = 'posts'
    app.model(Post)

    Comment = ds.createModel('comment', {
      id: { type: Number, id: true },
      postId: Number,
      title: String,
      comment: String
    })
    app.model(Comment)
    Comment.settings.plural = 'comments'
    Comment.belongsTo(Post, { as: 'post', foreignKey: 'postId' })

    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('Comments without a post', function (done) {
    beforeEach(function (done) {
      Comment.create(
        {
          title: 'my comment',
          comment: 'my post comment'
        },
        done
      )
    })

    describe('GET /comments/1/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/post').expect(200).end(done)
      })

      it('should return `null` keyed by `data`', function (done) {
        request(app).get('/comments/1/post').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.be.an('object')
          expect(res.body.links).to.be.an('object')
          expect(res.body.links.self).to.match(/comments\/1\/post/)
          expect(res.body.data).to.equal(null)
          done()
        })
      })
    })

    describe('GET /comments/1/relationships/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app)
          .get('/comments/1/relationships/post')
          .expect(200)
          .end(done)
      })

      it('should return `null` keyed by `data`', function (done) {
        request(app)
          .get('/comments/1/relationships/post')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.be.an('object')
            expect(res.body.links).to.be.an('object')
            expect(res.body.links.self).to.match(
              /comments\/1\/relationships\/post/
            )
            expect(res.body.links.related).to.match(/comments\/1\/post/)
            expect(res.body.data).to.equal(null)
            done()
          })
      })
    })
  })

  describe('Comment with a post and relationship back to comment', function (
    done
  ) {
    beforeEach(function (done) {
      Post.hasMany(Comment, { as: 'comments', foreignKey: 'postId' })
      Comment.create(
        [
          {
            title: 'my comment 1',
            comment: 'my post comment 1'
          },
          {
            title: 'my comment 2',
            comment: 'my post comment 2'
          }
        ],
        function (err, comments) {
          expect(err).to.equal(null)
          comments[1].post.create(
            {
              title: 'My post',
              content: 'My post content'
            },
            done
          )
        }
      )
    })

    describe('should display correct relationships', function () {
      it('GET /comments/2/post', function (done) {
        request(app).get('/comments/2/post').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.relationships.comments).to.be.an('object')
          expect(res.body.data.relationships.comments.links).to.be.an('object')
          expect(res.body.data.relationships.comments.links.related).to.match(
            /^http.*\/posts\/1\/comments$/
          )
          done()
        })
      })

      it('GET /posts/1', function (done) {
        request(app).get('/posts/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.relationships.comments).to.be.an('object')
          expect(res.body.data.relationships.comments.links).to.be.an('object')
          expect(res.body.data.relationships.comments.links.related).to.match(
            /^http.*\/posts\/1\/comments$/
          )
          done()
        })
      })
    })
  })

  describe('Comment with a post', function (done) {
    beforeEach(function (done) {
      Comment.create(
        {
          title: 'my comment',
          comment: 'my post comment'
        },
        function (err, comment) {
          expect(err).to.equal(null)
          comment.post.create(
            {
              title: 'My post',
              content: 'My post content'
            },
            done
          )
        }
      )
    })

    describe('GET /comments/1/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app).get('/comments/1/post').expect(200).end(done)
      })

      it('should display a single resource object keyed by `data`', function (
        done
      ) {
        request(app).get('/comments/1/post').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.be.an('object')
          expect(res.body.links).to.be.an('object')
          expect(res.body.links.self).to.match(/comments\/1\/post/)
          expect(res.body.data.attributes).to.deep.equal({
            title: 'My post',
            content: 'My post content'
          })
          expect(res.body.data.type).to.equal('posts')
          expect(res.body.data.id).to.equal('1')
          expect(res.body.data.links.self).to.match(/^http.*\/posts\/1$/)
          done()
        })
      })
    })

    describe('GET /comments/1/relationships/post', function () {
      it('should return status code 200 OK', function (done) {
        request(app)
          .get('/comments/1/relationships/post')
          .expect(200)
          .end(done)
      })

      it('should display a single resource object keyed by `data`', function (
        done
      ) {
        request(app)
          .get('/comments/1/relationships/post')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.be.an('object')
            expect(res.body.links).to.be.an('object')
            expect(res.body.links.self).to.match(
              /comments\/1\/relationships\/post/
            )
            expect(res.body.links.related).to.match(/comments\/1\/post/)
            expect(res.body.data).to.deep.equal({
              type: 'posts',
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
          'should return post relationship link in relationships object',
          function (done) {
            request(app).get('/comments').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data[0].relationships).to.be.an('object')
              expect(res.body.data[0].relationships.post).to.be.an('object')
              expect(res.body.data[0].relationships.post.links).to.be.an(
                'object'
              )
              expect(
                res.body.data[0].relationships.post.links.related
              ).to.match(/comments\/1\/post/)
              done()
            })
          }
        )

        it(
          'should not include data key relationships object if `include` is not specified',
          function (done) {
            request(app).get('/comments').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data[0].relationships.post).not.to.have.key(
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
              .get('/comments?filter[include]=post')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.data[0].relationships).to.be.an('object')
                expect(res.body.data[0].relationships.post).to.be.an('object')
                expect(res.body.data[0].relationships.post.data).to.deep.equal({
                  type: 'posts',
                  id: '1'
                })
                expect(res.body.data[0].relationships.post.links).to.be.an(
                  'object'
                )
                expect(
                  res.body.data[0].relationships.post.links.related
                ).to.match(/comments\/1\/post/)
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(1)
                expect(res.body.included[0]).to.have.all.keys(
                  'type',
                  'id',
                  'attributes'
                )
                expect(res.body.included[0].type).to.equal('posts')
                expect(res.body.included[0].id).to.equal('1')
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified.',
          function (done) {
            request(app)
              .get('/comments?filter[include]=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it(
          'should allow specifying `include` in the url to meet JSON API spec. eg. include=post',
          function (done) {
            request(app).get('/comments?include=post').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.included).to.be.an('array')
              expect(res.body.included.length).to.equal(1)
              done()
            })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.',
          function (done) {
            request(app)
              .get('/comments?include=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it('should not include foreign key data in attributes', function (done) {
          request(app).get('/comments').end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data[0].attributes).to.not.have.keys('postId')
            done()
          })
        })
      }
    )

    describe(
      'embedded relationship information for individual resource GET /:collection/:id',
      function () {
        it(
          'should return post relationship link in relationships object',
          function (done) {
            request(app).get('/comments/1').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data.relationships).to.be.an('object')
              expect(res.body.data.relationships.post).to.be.an('object')
              expect(res.body.data.relationships.post.links).to.be.an('object')
              expect(res.body.data.relationships.post.links.related).to.match(
                /comments\/1\/post/
              )
              done()
            })
          }
        )

        it(
          'should not include data key relationships object if `include` is not specified',
          function (done) {
            request(app).get('/comments/1').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data.relationships.post).not.to.have.key('data')
              done()
            })
          }
        )

        it(
          'should return included data as a compound document using key "included"',
          function (done) {
            request(app)
              .get('/comments/1?filter[include]=post')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.data.relationships).to.be.an('object')
                expect(res.body.data.relationships.post).to.be.an('object')
                // expect(res.body.data.relationships.post.data).to.deep.equal({
                //   type: 'posts',
                //   id: '1'
                // })
                expect(res.body.data.relationships.post.links).to.be.an(
                  'object'
                )
                expect(res.body.data.relationships.post.links.related).to.match(
                  /comments\/1\/post/
                )
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(1)
                expect(res.body.included[0]).to.have.all.keys(
                  'type',
                  'id',
                  'attributes'
                )
                expect(res.body.included[0].type).to.equal('posts')
                expect(res.body.included[0].id).to.equal('1')
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified.',
          function (done) {
            request(app)
              .get('/comments/1?filter[include]=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it(
          'should allow specifying `include` in the url to meet JSON API spec. eg. include=post',
          function (done) {
            request(app)
              .get('/comments/1?include=post')
              .end(function (err, res) {
                expect(err).to.equal(null)
                expect(res.body.included).to.be.an('array')
                expect(res.body.included.length).to.equal(1)
                done()
              })
          }
        )

        it(
          'should return a 400 Bad Request error if a non existent relationship is specified using JSON API syntax.',
          function (done) {
            request(app)
              .get('/comments/1?include=doesnotexist')
              .expect(400)
              .end(done)
          }
        )

        it('should not include foreign key data in attributes', function (done) {
          request(app).get('/comments/1').end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.attributes).to.not.have.keys('postId')
            done()
          })
        })
      }
    )

    describe.skip('link related models using relationship url', function () {
      beforeEach(function (done) {
        Post.create({ name: 'my post', content: 'my post content' }, done)
      })
      it('should create and link models', function (done) {
        request(app)
          .post('/posts/1/relationships/comments')
          .send({
            data: {
              type: 'posts',
              attributes: { title: 'my post', content: 'my post content' }
            },
            relationships: {
              comments: {
                data: [{ type: 'comments', id: 1 }]
              }
            }
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(null)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(2)
              done()
            })
          })
      })
    })
  })

  describe('Two comments, one each belonging to two posts', function () {
    describe('Creating comments and posts via code', function () {
      beforeEach(function (done) {
        Comment.create(
          [
            {
              title: 'First comment',
              comment: 'Comment 1 text'
            },
            {
              title: 'Second comment',
              comment: 'Comment 2 text'
            }
          ],
          function (err, comments) {
            expect(err).to.equal(null)
            comments[0].post.create(
              {
                title: 'Post 1',
                content: 'This is my first post'
              },
              function (err) {
                expect(err).to.equal(null)
                comments[1].post.create(
                  {
                    title: 'Post 2',
                    content: 'This is my second post'
                  },
                  done
                )
              }
            )
          }
        )
      })

      it('should have two posts', function (done) {
        request(app).get('/posts').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data).to.be.an('array')
          expect(res.body.data.length).to.equal(2)
          done()
        })
      })

      it('should have a single comment per post', function (done) {
        request(app).get('/comments/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.relationships).to.not.be.an('array')
          expect(res.body.data.relationships).to.have.key('post')
          done()
        })
      })

      it(
        'should keep relationship consistent even with multiple requests for post',
        function (done) {
          request(app).get('/comments/1/post').end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.id).to.equal('1')
            request(app).get('/comments/1/post').end(function (err, res) {
              expect(err).to.equal(null)
              expect(res.body.data.id).to.equal('1')
              done()
            })
          })
        }
      )
    })
  })

  describe('creating comments and posts via XHR requests', function () {
    beforeEach(function (done) {
      request(app)
        .post('/posts/')
        .send({
          data: {
            type: 'posts',
            attributes: { title: 'Post 1', content: 'This is my first post' }
          }
        })
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/json')
        .end(function (err) {
          expect(err).to.equal(null)
          request(app)
            .post('/posts')
            .send({
              data: {
                type: 'posts',
                attributes: {
                  title: 'Post 2',
                  content: 'This is my second post'
                }
              }
            })
            .set('Accept', 'application/vnd.api+json')
            .set('Content-Type', 'application/json')
            .end(function (err) {
              expect(err).to.equal(null)
              request(app)
                .post('/comments')
                .send({
                  data: {
                    type: 'comments',
                    attributes: {
                      title: 'First comment',
                      comment: 'Comment 1 text'
                    },
                    relationships: {
                      post: { data: { type: 'posts', id: '1' } }
                    }
                  }
                })
                .set('Accept', 'application/vnd.api+json')
                .set('Content-Type', 'application/json')
                .end(function (err) {
                  expect(err).to.equal(null)
                  request(app)
                    .post('/comments')
                    .send({
                      data: {
                        type: 'comments:',
                        attributes: {
                          title: 'Second comment',
                          comment: 'Comment 2 text'
                        },
                        relationships: {
                          post: { data: { type: ' posts', id: '2' } }
                        }
                      }
                    })
                    .set('Accept', 'application/vnd.api+json')
                    .set('Content-Type', 'application/json')
                    .end(function (err) {
                      expect(err).to.equal(null)
                      done()
                    })
                })
            })
        })
    })

    it(
      'should keep relationship consistent even with multiple requests for post',
      function (done) {
        request(app).get('/comments/1/post').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.id).to.equal('1')
          request(app).get('/comments/1/post').end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body.data.id).to.equal('1')
            done()
          })
        })
      }
    )
  })
})
