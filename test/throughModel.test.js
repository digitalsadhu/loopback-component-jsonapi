'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var RSVP = require('rsvp')
var app, User, Interest, Topic

describe('through Model', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')

    User = ds.createModel('user', {
      id: { type: Number, id: true },
      name: String
    })

    app.model(User)

    Topic = ds.createModel('topic', {
      id: { type: Number, id: true },
      name: String
    })

    app.model(Topic)

    Interest = ds.createModel('interest', {
      id: { type: Number, id: true }
    })

    app.model(Interest)

    User.hasMany(Topic, { through: Interest })
    Topic.hasMany(User, { through: Interest })

    Interest.belongsTo(User)
    Interest.belongsTo(Topic)

    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  it('should allow interest to be created', function (done) {
    User.create({ name: 'User 1' }, function (err, user) {
      expect(err).to.equal(null)

      Topic.create({ name: 'Topic 1' }, function (err, topic) {
        expect(err).to.equal(null)

        request(app)
          .post('/interests')
          .send({
            data: {
              type: 'interests',
              attributes: {},
              relationships: {
                user: { data: { id: user.id, type: 'users' } },
                topic: { data: { id: topic.id, type: 'topics' } }
              }
            }
          })
          .end(function (err, res) {
            expect(err).to.equal(null)
            expect(res).to.not.have.deep.property('body.errors')
            expect(res.body.data.id).to.equal('1')
            done(err)
          })
      })
    })
  })

  it('should retrieve user topics via include', function (done) {
    makeData()
      .then(function () {
        request(app).get('/users/1?include=topics').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.relationships.topics.data).to.have
            .property('length')
            .and.equal(2)
          expect(res.body.data.relationships.topics.data[0].type).to.equal(
            'topics'
          )
          expect(res.body.data.relationships.topics.data[1].type).to.equal(
            'topics'
          )
          expect(res.body.included[0].type).to.equal('topics')
          expect(res.body.included[0].id).to.equal('1')
          expect(res.body.included[1].type).to.equal('topics')
          expect(res.body.included[1].id).to.equal('2')
          done(err)
        })
      })
      .catch(done)
  })

  it('should retrieve topic users via include', function (done) {
    makeData()
      .then(function () {
        request(app).get('/topics/1?include=users').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.relationships.users.data).to.have
            .property('length')
            .and.equal(1)
          expect(res.body.data.relationships.users.data[0].type).to.equal(
            'users'
          )
          expect(res.body.included[0].type).to.equal('users')
          expect(res.body.included[0].id).to.equal('1')
          done(err)
        })
      })
      .catch(done)
  })
})

function makeData (done) {
  var createUser = denodeifyCreate(User)
  var createTopic = denodeifyCreate(Topic)
  var createInterest = denodeifyCreate(Interest)

  return RSVP.hash({
    user: createUser({ name: 'User 1' }),
    topics: RSVP.all([
      createTopic({ name: 'Topic 1' }),
      createTopic({ name: 'Topic 2' })
    ])
  })
    .then(function (models) {
      return RSVP.all([
        createInterest({
          userId: models.user.id,
          topicId: models.topics[0].id
        }),
        createInterest({ userId: models.user.id, topicId: models.topics[1].id })
      ])
    })

  function denodeifyCreate (Model) {
    return RSVP.denodeify(Model.create.bind(Model))
  }
}
