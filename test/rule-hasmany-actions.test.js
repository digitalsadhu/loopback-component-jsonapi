var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app
var Rule
var Action
var ds

describe('Rule `hasMany` Action relationships', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')

    Action = ds.createModel('action', {
      name: String
    })
    Action.settings.plural = 'actions'
    app.model(Action)

    Rule = ds.createModel('rule', {
      name: String
    })
    Rule.settings.plural = 'rules'
    app.model(Rule)

    Rule.hasMany(Action, { as: 'actions', foreignKey: 'ruleId' })
    app.use(loopback.rest())
    JSONAPIComponent(app)
  })

  describe('updating relationships using a PATCH', function (done) {
    beforeEach(function (done) {
      Action.create(
        [
          { name: 'action 1', ruleId: 10 },
          { name: 'action 2', ruleId: 10 },
          { name: 'action 3', ruleId: 10 }
        ],
        function (err, actions) {
          if (err) console.error(err)
          Rule.create([{ name: 'rule 1' }, { name: 'rule 2' }], done)
        }
      )
    })
    it('should update foreign keys on Action model', function () {
      request(app)
        .patch('/rules/2')
        .send({
          data: {
            id: 2,
            attributes: {
              name: 'enter 2'
            },
            relationships: {
              actions: {
                data: [{ type: 'actions', id: 2 }, { type: 'actions', id: 3 }]
              }
            },
            type: 'rules'
          }
        })
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.status).to.equal(200)
          expect(res.body).not.to.have.keys('errors')
          Rule.find(function (err, rules) {
            if (err) console.error(err)
            Action.find(function (err, actions) {
              if (err) console.error(err)
              expect(actions[0].ruleId).to.equal(10)
              expect(actions[1].ruleId).to.equal(2)
              expect(actions[2].ruleId).to.equal(2)
              done()
            })
          })
        })
    })
  })
})
