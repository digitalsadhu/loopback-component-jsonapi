var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var _ = require('lodash')
var app
var Post
var Comment
var ds
var Person

describe('loopback json api belongsTo relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    })
    app.model(Post)

    Comment = ds.createModel('comment', {
      id: {type: Number, id: true},
      postId: Number,
      title: String,
      comment: String
    })
    app.model(Comment)
    Comment.settings.plural = 'comments'
    Comment.belongsTo(Post, {as: 'post', foreignKey: 'postId'})
    Post.hasMany(Comment, {as: 'comments', foreignKey: 'postId'})

    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('Comment with an post', function (done) {
    beforeEach(function (done) {
      Comment.create({
        title: 'my comment',
        comment: 'my post comment'
      }, function (err, comment) {
        expect(err).to.equal(null)
        comment.post.create({
          title: 'My post',
          content: 'My post content'
        }, done)
      })
    })

    describe('link related models as part of a create operation', function () {
      it('should create and link models', function (done) {
        request(app).post('/posts')
          .send({
            data: {
              type: 'posts',
              attributes: {
                title: 'my post',
                content: 'my post content'
              },
              relationships: {
                comments: {
                  data: [
                    {
                      type: 'comments',
                      id: 1
                    }
                  ]
                }
              }
            }
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(undefined)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(2)

              done()
            })
          })
      })
    })

    describe('delete linkages to models as part of an update operation', function () {
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1')
          .send({
            data: {type: 'posts', id: '1', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: []}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(undefined)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(null)

              done()
            })
          })
      })
    })

    describe('replace linkages as part of an update operation', function () {
      beforeEach(function (done) {
        Comment.create({
          title: 'my comment 2',
          comment: 'my post comment 2'
        }, done)
      })
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1').send({
          data: {type: 'posts', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: [
                  {type: 'comments', id: 1},
                  {type: 'comments', id: 2}
          ]}}}
        })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.find({postId: 1}, function (err, comments) {
              expect(err).to.equal(undefined)
              expect(comments.length).to.equal(2)

              done()
            })
          })
      })
    })

    describe('delete linkages to models as part of an update operation', function () {
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1')
          .send({
            data: {type: 'posts', id: '1', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: []}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(undefined)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(null)

              done()
            })
          })
      })
    })

    describe('replace linkages as part of an update operation', function () {
      beforeEach(function (done) {
        Post.create({
          name: 'my post',
          content: 'my post content'
        }, done)
      })
      it('should not create new record', function (done) {
        request(app).patch('/posts/1').send({
          data: {type: 'posts', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: [
                  {type: 'comments', id: 1},
                  {type: 'comments', id: 2}
          ]}}}
        })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.find({postId: 1}, function (err, comments) {
              expect(err).to.equal(undefined)
              expect(comments.length).not.to.equal(2)

              done()
            })
          })
      })
    })

    describe('belongsTo relationship updating', function () {
      beforeEach(function (done) {
        Comment.create([{
          title: 'my comment 2',
          comment: 'my post comment 2'
        }, {
          title: 'my comment 3',
          comment: 'my post comment 3'
        }], function (er, comments) {
          comments[0].post.create({
            id: '3',
            title: 'My post 2',
            content: 'My post content 2'
          })
          comments[1].post.create({
            id: '2',
            title: 'My post 2',
            content: 'My post content 2'
          }, done)
        })
      })

      it('should only update the foreign key on the belongsTo model', function (done) {
        request(app).patch('/comments/3')
          .send({
            'data': {
              'id': 3,
              'attributes': {
                'name': 'enter'
              },
              'relationships': {
                'post': {
                  'data': {
                    'type': 'posts',
                    'id': 3
                  }
                }
              },
              'type': 'comments'
            }
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)

            Comment.find({}, function (err, comments) {
              expect(err).to.equal(undefined)
              _.each(comments, function (comment) {
                expect(comment.postId).not.to.equal(null)
              })

              done()
            })

          })
      })
    })

  })

})

describe('loopback json api hasOne relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    })
    app.model(Post)

    Person = ds.createModel('person', {
      id: {type: Number, id: true},
      postId: Number,
      name: String
    })
    app.model(Person)
    Post.hasOne(Person, {as: 'author', foreignKey: 'postId'})
    Person.settings.plural = 'people'

    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('Post with an author', function (done) {
    beforeEach(function (done) {
      Post.create({
        name: 'my post',
        content: 'my post content'
      }, function (err, post) {
        expect(err).to.equal(null)
        post.author.create({
          name: 'Bob Jones'
        }, done)
      })
    })

    describe('link related models as part of a create operation', function () {
      it('should create and link models', function (done) {
        request(app).post('/posts')
          .send({
            data: {type: 'posts', attributes: {title: 'my post', content: 'my post content' },
            relationships: {author: {data: {type: 'people', id: 1}}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).not.to.have.keys('errors')
            expect(res.status).to.equal(201)
            Person.findById(1, function (err, person) {
              expect(err).to.equal(undefined)
              expect(person).not.to.equal(null)
              expect(person.postId).to.equal(2)

              done()
            })
          })
      })
    })

    describe('delete linkages to models as part of an update operation', function () {
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1')
          .send({
            data: {type: 'posts', id: 1, attributes: {title: 'my post', content: 'my post content' },
            relationships: {author: {data: null}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).not.to.have.keys('errors')
            expect(res.status).to.equal(200)
            Person.findById(1, function (err, person) {
              expect(err).to.equal(undefined)
              expect(person).not.to.equal(null)
              expect(person.postId).to.equal(null)
              done()
            })
          })
      })
    })

    describe('replace linkages as part of an update operation', function () {
      beforeEach(function (done) {
        Person.create({name: 'Rachel McAdams'}, done)
      })
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1').send({
          data: {type: 'posts', id: '1', attributes: {title: 'my post', content: 'my post content' },
          relationships: {author: {data: {type: 'people', id: 2}}}}
        })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Person.find({where: {postId: 1}}, function (err, people) {
              expect(err).to.equal(undefined)
              expect(people.length).to.equal(1)
              expect(people[0].id).to.equal(2)
              done()
            })
          })
      })
    })

  })
})

describe('loopback json api hasMany relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    })
    app.model(Post)

    Comment = ds.createModel('comment', {
      id: {type: Number, id: true},
      postId: Number,
      title: String,
      comment: String
    })
    app.model(Comment)
    Post.hasMany(Comment, {as: 'comments', foreignKey: 'postId'})
    Comment.settings.plural = 'comments'
    Comment.belongsTo(Post, {as: 'post', foreignKey: 'postId'})
    app.use(loopback.rest())
    JSONAPIComponent(app, {restApiRoot: '/'})
  })

  describe('Fetch a post with a comment', function (done) {
    beforeEach(function (done) {
      Post.create({
        title: 'my post',
        content: 'my post content'
      }, function (err, post) {
        expect(err).to.equal(null)
        post.comments.create({
          title: 'My comment',
          comment: 'My comment text'
        }, done)
      })
    })

    describe('link related models as part of a create operation', function () {
      it('should create and link models', function (done) {
        request(app).post('/posts')
          .send({
            data: {type: 'posts', attributes: {title: 'my post', content: 'my post content' },
              relationships: {comments: {data: [
                    {type: 'comments', id: 1}
            ]}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(undefined)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(2)
              done()
            })
          })
      })
    })

    describe('delete linkages to models as part of an update operation', function () {
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1')
          .send({
            data: {type: 'posts', id: '1', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: []}}}
          })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.findById(1, function (err, comment) {
              expect(err).to.equal(undefined)
              expect(comment).not.to.equal(null)
              expect(comment.postId).to.equal(null)
              done()
            })
          })
      })
    })

    describe('replace linkages as part of an update operation', function () {
      beforeEach(function (done) {
        Comment.create({
          title: 'my comment 2',
          comment: 'my post comment 2'
        }, done)
      })
      it('should update model linkages', function (done) {
        request(app).patch('/posts/1').send({
          data: {type: 'posts', attributes: {title: 'my post', content: 'my post content' },
            relationships: {comments: {data: [
                  {type: 'comments', id: 1},
                  {type: 'comments', id: 2}
          ]}}}
        })
          .set('Accept', 'application/vnd.api+json')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            expect(err).to.equal(null)
            Comment.find({postId: 1}, function (err, comments) {
              expect(err).to.equal(undefined)
              expect(comments.length).to.equal(2)
              done()
            })
          })
      })
    })

  })

})
