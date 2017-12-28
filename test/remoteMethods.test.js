'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app, Post, Archive

describe('loopback json api remote methods', function () {
  var autocompleteTitleData = ['Post 1', 'Post 2']

  var archiveData = {
    id: 10,
    raw: {
      id: 1,
      title: 'Ancient Post 1',
      content: 'Ancient Content of Post 1'
    },
    createdAt: Date.now()
  }

  var postData = {
    id: 1,
    title: 'Post 1',
    content: 'Content of Post 1'
  }

  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')

    Archive = ds.createModel('archive', {
      id: { type: Number, id: true },
      raw: Object,
      createAt: Date
    })

    Post = ds.createModel('post', {
      id: { type: Number, id: true },
      title: String,
      content: String
    })

    Post.greet = function (msg, cb) {
      cb(null, 'Greetings... ' + msg)
    }

    Post.last = function (cb) {
      Post.findOne({}, cb)
    }

    Post.autocomplete = function (q, cb) {
      cb(null, autocompleteTitleData)
    }

    Post.prototype.findArchives = function (cb) {
      Archive.find({}, cb)
    }

    Post.remoteMethod('greet', {
      accepts: { arg: 'msg', type: 'string' },
      returns: { arg: 'greeting', type: 'string' }
    })

    Post.remoteMethod('last', {
      returns: { root: true },
      http: { verb: 'get' }
    })

    Post.remoteMethod('autocomplete', {
      jsonapi: false,
      accepts: { arg: 'q', type: 'string', http: { source: 'query' } },
      returns: { root: true, type: 'array' },
      http: { path: '/autocomplete', verb: 'get' }
    })

    Post.remoteMethod('prototype.findArchives', {
      jsonapi: true,
      returns: { root: true, type: 'archive' },
      http: { path: '/archives' }
    })

    app.model(Post)
    app.model(Archive)
    app.use(loopback.rest())

    Promise.all([Archive.create(archiveData), Post.create(postData)])
      .then(function () {
        done()
      })
  })

  describe('for application/json', function () {
    beforeEach(function () {
      JSONAPIComponent(app)
    })

    it('POST /posts/greet should return remote method message', function (done) {
      request(app)
        .post('/posts/greet')
        .send({ msg: 'John' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.greeting).to.equal('Greetings... John')
          done()
        })
    })
  })

  describe('should serialize with `jsonapi: true`', function () {
    beforeEach(function () {
      JSONAPIComponent(app)
    })

    testAutocompleteJsonAPI()
    testArchivesJsonAPI()
  })

  describe('when `serializeCustomRemote` is set', function (done) {
    beforeEach(function () {
      JSONAPIComponent(app, { handleCustomRemote: true })
    })

    testAutocompleteJsonAPI()
    testArchivesJsonAPI()
    testLastJsonAPI()
  })

  describe('when `exclude` is set', function (done) {
    beforeEach(function () {
      JSONAPIComponent(app, {
        handleCustomRemote: true,
        exclude: [{ methods: ['last', 'autocomplete', 'archives'] }],
        include: [{ methods: 'last' }]
      })
    })

    testArchivesJsonAPI()
    testAutocompleteJsonAPI()
    testLastRaw()
  })

  describe('when `include` is set', function (done) {
    beforeEach(function () {
      JSONAPIComponent(app, {
        handleCustomRemote: false,
        include: [{ methods: 'last' }]
      })
    })

    testArchivesJsonAPI()
    testAutocompleteJsonAPI()
    testLastJsonAPI()
  })

  /* Static test */
  function testAutocompleteJsonAPI () {
    it(
      'GET /posts/autocomplete should return an array with raw format (`jsonapi: false` has precedence)',
      function (done) {
        request(app)
          .get('/posts/autocomplete')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.deep.equal(autocompleteTitleData)
            done()
          })
      }
    )
  }

  /* Static test */
  function testArchivesJsonAPI () {
    it(
      'GET /posts/1/archives should return a JSONApi list of Archive (`jsonapi: true` has precedence)',
      function (done) {
        request(app)
          .get('/posts/1/archives')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.be.an('object')
            expect(res.body.data).to.be.an('array').with.lengthOf(1)
            expect(res.body.data[0].id).to.equal(archiveData.id + '')
            expect(res.body.data[0].attributes).to.deep.equal({
              raw: archiveData.raw,
              createdAt: archiveData.createdAt
            })

            done()
          })
      }
    )
  }

  /* Static test */
  function testLastJsonAPI () {
    it('GET /posts/last should return a JSONApi Post', function (done) {
      request(app).get('/posts/last').expect(200).end(function (err, res) {
        expect(err).to.equal(null)

        expect(res.body.data).to.be.an('object')
        expect(res.body.data.id).to.equal(postData.id + '')
        expect(res.body.data.attributes).to.deep.equal({
          title: postData.title,
          content: postData.content
        })

        done()
      })
    })
  }

  /* Static test */
  function testLastRaw () {
    it(
      'GET /posts/last should return a raw Post (exclude is more important than include and handleCustomRemote)',
      function (done) {
        request(app).get('/posts/last').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.deep.equal(postData)
          done()
        })
      }
    )
  }
})
