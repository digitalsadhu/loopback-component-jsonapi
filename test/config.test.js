var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')

var app
var Image

describe('Dont override config.js ', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    app.use(loopback.rest())

    var remotes = app.remotes()
    remotes.options.json = {limit: '100B'}
    var ds = loopback.createDataSource('memory')
    Image = ds.createModel('image', {
      id: {type: Number, id: true},
      source: String
    })

    app.model(Image)

    JSONAPIComponent(app)
  })

  it('should have limit property', function (done) {
    var remotes = app.remotes()
    expect(remotes.options.json).to.have.any.keys('limit')
    done()
  })

  it('should accept payload < 100B', function (done) {
    request(app).post('/images')
      .send({
        data: {
          type: 'images',
          attributes: {
            source: 'a'
          }
        }
      })
      .set('Accept', 'application/vnd.api+json')
      .set('Content-Type', 'application/json')
      .expect(201)
      .end(done)
  })

  it('should not accept payload > 100B', function (done) {
    request(app).post('/images')
      .send({
        data: {
          type: 'images',
          attributes: {
            source: 'A long text to make the payload greater then 100B'
          }
        }
      })
      .set('Accept', 'application/vnd.api+json')
      .set('Content-Type', 'application/json')
      .expect(400)
      .end(done)
  })

})
