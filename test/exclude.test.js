var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Post
var Comment

describe('exclude option', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')

    Post = ds.createModel('post', { title: String })
    app.model(Post)

    Comment = ds.createModel('comment', { comment: String })
    app.model(Comment)

    app.use(loopback.rest())

    Post.create({ title: 'my post' }, function () {
      Comment.create({ comment: 'my comment' }, done)
    })
  })

  describe('excluding a specific model', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        exclude: [{ model: 'post' }]
      })
    })
    it('should not apply jsonapi to post model method input', function (done) {
      request(app)
        .post('/posts')
        .send({ title: 'my post' })
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/json')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.deep.equal({ title: 'my post', id: 2 })
          done()
        })
    })
    it('should not apply jsonapi to post model output', function (done) {
      request(app).get('/posts').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body).to.deep.equal([{ title: 'my post', id: 1 }])
        done()
      })
    })
    it('should apply jsonapi to comment model method output', function (done) {
      request(app).get('/comments').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0]).to.have.keys(
          'type',
          'id',
          'attributes',
          'links'
        )
        done()
      })
    })
  })

  describe('excluding a specific method', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        exclude: [{ methods: 'find' }]
      })
    })

    it(
      'should not apply jsonapi to post model output for find method',
      function (done) {
        request(app).get('/posts').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.deep.equal([{ title: 'my post', id: 1 }])
          done()
        })
      }
    )

    it(
      'should not apply jsonapi to comment model output for find method',
      function (done) {
        request(app).get('/comments').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.deep.equal([{ comment: 'my comment', id: 1 }])
          done()
        })
      }
    )

    it(
      'should apply jsonapi to post model output for findById method',
      function (done) {
        request(app).get('/posts/1').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data).to.have.keys(
            'type',
            'id',
            'attributes',
            'links'
          )
          done()
        })
      }
    )

    it(
      'should apply jsonapi to comment model output for findById method',
      function (done) {
        request(app).get('/comments/1').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data).to.have.keys(
            'type',
            'id',
            'attributes',
            'links'
          )
          done()
        })
      }
    )
  })

  describe('excluding a specific method on a specific model', function () {
    beforeEach(function () {
      JSONAPIComponent(app, {
        exclude: [{ model: 'post', methods: 'find' }]
      })
    })

    it(
      'should not apply jsonapi to post model output for find method',
      function (done) {
        request(app).get('/posts').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body).to.deep.equal([{ title: 'my post', id: 1 }])
          done()
        })
      }
    )

    it(
      'should apply jsonapi to post model output for findById method',
      function (done) {
        request(app).get('/posts/1').expect(200).end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data).to.have.keys(
            'type',
            'id',
            'attributes',
            'links'
          )
          done()
        })
      }
    )

    it('should apply jsonapi to comment model output for find method', function (
      done
    ) {
      request(app).get('/comments').expect(200).end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0]).to.have.keys(
          'type',
          'id',
          'attributes',
          'links'
        )
        done()
      })
    })
  })

  describe(
    'excluding a specific set of methods on a specific model',
    function () {
      beforeEach(function () {
        JSONAPIComponent(app, {
          exclude: [{ model: 'post', methods: ['find', 'findById'] }]
        })
      })

      it(
        'should not apply jsonapi to post model output for find method',
        function (done) {
          request(app).get('/posts').expect(200).end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.deep.equal([{ title: 'my post', id: 1 }])
            done()
          })
        }
      )

      it(
        'should not apply jsonapi to post model output for findById method',
        function (done) {
          request(app).get('/posts/1').expect(200).end(function (err, res) {
            expect(err).to.equal(null)
            expect(res.body).to.deep.equal({ title: 'my post', id: 1 })
            done()
          })
        }
      )
    }
  )
})
