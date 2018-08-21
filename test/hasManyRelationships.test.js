'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app, Post, Comment, Author, ds

describe('loopback json api hasMany relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')

    Post = ds.createModel('post', {
      title: String,
      content: String
    })
    app.model(Post)

    Comment = ds.createModel('comment', {
      title: String,
      comment: String
    })
    Comment.settings.plural = 'comments'
    app.model(Comment)

    Author = ds.createModel('author', {
      firstName: String,
      lastName: String
    })
    Author.settings.plural = 'authors'
    app.model(Author)

    Post.hasMany(Comment)
    Comment.belongsTo(Post)
    Post.belongsTo(Author)
    Author.hasMany(Post)

    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  describe('Multiple `includes`', function (done) {
    beforeEach(function (done) {
      Author.create(
        {
          firstName: 'Joe',
          lastName: 'Shmoe'
        },
        function (err, author) {
          expect(err).to.equal(null)
          author.posts.create(
            {
              title: 'my post',
              content: 'my post content'
            },
            function (err, post) {
              expect(err).to.equal(null)
              post.comments.create(
                [
                  {
                    title: 'My comment',
                    comment: 'My comment text'
                  },
                  {
                    title: 'My second comment',
                    comment: 'My second comment text'
                  }
                ],
                done
              )
            }
          )
        }
      )
    })

    it('should sideload author and comments', function (done) {
      request(app)
        .get('/posts/1/?include=author,comments')
        .expect(200)
        .end(function (err, res) {
          var data = res.body.data
          expect(err).to.equal(null)
          expect(data.id).to.equal('1')
          expect(data.type).to.equal('posts')
          expect(data.relationships).to.be.a('object')
          expect(data.relationships.author).to.be.a('object')
          expect(data.relationships.author.data.id).to.equal('1')
          expect(data.relationships.author.data.type).to.equal('authors')
          expect(data.relationships.comments.data).to.be.a('array')
          expect(data.relationships.comments.data[0].id).to.equal('1')
          expect(data.relationships.comments.data[0].type).to.equal('comments')
          expect(data.relationships.comments.data[1].id).to.equal('2')
          expect(data.relationships.comments.data[1].type).to.equal('comments')
          expect(data.attributes).to.deep.equal({
            title: 'my post',
            content: 'my post content'
          })
          expect(res.body.included).to.be.an('array')
          expect(res.body.included.length).to.equal(3)

          const validateData = (slug, included) => {
            switch (slug) {
              case 'authors1':
                return expect(included).to.deep.equal({
                  id: '1',
                  type: 'authors',
                  attributes: {
                    firstName: 'Joe',
                    lastName: 'Shmoe'
                  },
                  relationships: {
                    posts: {
                      links: {
                        related: included.relationships.posts.links.related
                      }
                    }
                  }
                })
              case 'comments1':
                return expect(included).to.deep.equal({
                  id: '1',
                  type: 'comments',
                  attributes: {
                    title: 'My comment',
                    comment: 'My comment text'
                  },
                  relationships: {
                    post: {
                      data: {
                        id: 1,
                        type: 'posts'
                      },
                      links: {
                        related: included.relationships.post.links.related
                      }
                    }
                  }
                })
              case 'comments2':
                return expect(included).to.deep.equal({
                  id: '2',
                  type: 'comments',
                  attributes: {
                    title: 'My second comment',
                    comment: 'My second comment text'
                  },
                  relationships: {
                    post: {
                      data: {
                        id: 1,
                        type: 'posts'
                      },
                      links: {
                        related: included.relationships.post.links.related
                      }
                    }
                  }
                })
            }
          }

          const verifiedIncluded = []
          for (const included of res.body.included) {
            const slug = included.type + included.id
            expect(verifiedIncluded).to.not.include(slug)
            validateData(slug, included)
            verifiedIncluded.push(slug)
          }

          done()
        })
    })
  })

  describe('Duplicate models in `includes`', function () {
    beforeEach(function () {
      const Foo = ds.createModel('foo', { title: String })
      app.model(Foo)
      const Bar = ds.createModel('bar', { title: String })
      app.model(Bar)
      Foo.hasMany(Bar)
      Foo.belongsTo(Bar)

      return Promise.all([
        Foo.create({ title: 'one', barId: 1 }),
        Bar.create({ title: 'one', barId: 1, fooId: 1 })
      ])
    })

    it('should not occur', function () {
      return request(app)
        .get('/foos/1/?include=bars,bar')
        .expect(200)
        .then(function (res) {
          expect(res.body.included.length).to.equal(
            1,
            'Should be exactly 1 item in included array'
          )
        })
    })
  })
})
