'use strict'

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var app, Rule, Action, Card, ds

describe('belongsTo through hasMany', function () {
  beforeEach(function () {
    app = loopback()
    app.set('legacyExplorer', false)
    ds = loopback.createDataSource('memory')

    Rule = ds.createModel('rule', {
      id: { type: Number, id: true },
      name: String
    })

    app.model(Rule)

    Action = ds.createModel('action', {
      id: { type: Number, id: true },
      cardId: Number,
      name: String
    })

    app.model(Action)

    Card = ds.createModel('card', {
      id: { type: Number, id: true },
      title: String
    })

    app.model(Card)

    Rule.hasMany(Action, { as: 'actions', foreignKey: 'ruleId' })
    Action.belongsTo(Card, { as: 'card', foreignKey: 'cardId' })
    Card.hasMany(Action, { as: 'actions', foreignKey: 'cardId' })
    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '/' })
  })

  describe('relationship should point to its relationship', function () {
    beforeEach(function (done) {
      Rule.create(
        {
          name: 'Rule 1'
        },
        function (err, rule) {
          expect(err).to.equal(null)
          rule.actions.create(
            [{ name: 'Action 1', cardId: 1 }, { name: 'Action 2', cardId: 1 }],
            function (err, res) {
              expect(err).to.equal(null)
              Card.create([{ title: 'Card 1' }], done)
            }
          )
        }
      )
    })

    it('GET /rules/1/actions', function (done) {
      request(app).get('/rules/1/actions').end(function (err, res) {
        expect(err).to.equal(null)
        expect(res.body.data[0].relationships.card).to.be.an('object')
        expect(res.body.data[0].relationships.card.links).to.be.an('object')
        expect(res.body.data[0].relationships.card.links.related).to.match(
          /\/actions\/1\/card/
        )
        expect(res.body.data[1].relationships.card.links.related).to.match(
          /\/actions\/2\/card/
        )
        done()
      })
    })
  })
})
