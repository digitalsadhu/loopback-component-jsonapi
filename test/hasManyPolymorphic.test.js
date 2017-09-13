'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var ds
var Post
var Resource

describe('loopback json api hasMany polymorphic relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')

    Resource = ds.createModel('resource', {
      id: { type: Number, id: true },
      fileName: String,
      parentId: Number,
      parentType: String
    })
    Resource.settings.plural = 'resources'
    app.model(Resource)

    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })
    Post.settings.plural = 'posts'
    Post.hasMany(Resource, {
      as: 'resources',
      polymorphic: 'parent'
    })
    app.model(Post)

    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('Post hasMany Resources', function () {
    beforeEach(function (done) {
      Post.create(
        {
          title: 'Post One',
          content: 'Content'
        },
        function (err, post) {
          expect(err).to.equal(null)
          post.resources.create(
            {
              fileName: 'blah.jpg',
              parentId: post.id,
              parentType: 'post'
            },
            done
          )
        }
      )
    })

    it('should have a relationship to Resources', function (done) {
      request(app).get('/posts/1').end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body).to.not.have.key('errors')
        expect(res.body.data.relationships.resources).to.be.an('object')
        done()
      })
    })

    it(
      'should return the Resources that belong to this Post when included flag is present',
      function (done) {
        request(app).get('/posts/1?include=resources').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.not.have.key('errors')
          expect(res.body.included).to.be.an('array')
          expect(res.body.included[0].type).to.equal('resources')
          expect(res.body.included[0].id).to.equal('1')
          done()
        })
      }
    )

    it(
      'should return the Resources that belong to this Post when following the relationship link',
      function (done) {
        request(app).get('/posts/1').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.not.have.key('errors')
          const relationships = res.body.data.relationships
          const url = relationships.resources.links.related.split('api')[1]
          request(app).get(url).end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.not.have.key('errors')
            expect(res.body.data).to.be.an('array')
            expect(res.body.data[0].type).to.equal('resources')
            expect(res.body.data[0].id).to.equal('1')
            done()
          })
        })
      }
    )
  })
})
