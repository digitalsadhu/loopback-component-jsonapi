'use strict'

/* global describe, beforeEach, it */

var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var RSVP = require('rsvp')

var app
var Movie, Category, MovieCategory

describe('hasManyThrough upsert', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    // create models
    Movie = ds.createModel('movie', {
      id: { type: String, id: true },
      name: String
    })

    Category = ds.createModel('category', {
      id: { type: String, id: true },
      name: String
    })

    MovieCategory = ds.createModel('movieCategory', {
      id: { type: Number, id: true }
    })

    // add models
    app.model(Movie)
    app.model(Category)
    app.model(MovieCategory)

    // set up relationships
    Movie.hasMany(Category, { through: MovieCategory })
    Category.hasMany(Movie, { through: MovieCategory })

    MovieCategory.belongsTo(Movie)
    MovieCategory.belongsTo(Category)
    makeData()
      .then(function () {
        done()
      })
      .catch(function (err) {
        done(err)
      })
    app.use(loopback.rest())
    JSONAPIComponent(app, { restApiRoot: '' })
  })

  it('should make initial data', function (done) {
    request(app).get('/movies/M1/categories').end(function (err, res) {
      expect(err).to.equal(null)
      expect(res.body.data.length).to.equal(2)
      expect(res.body.data[0].attributes.name).to.equal('Crime')
      done(err)
    })
  })

  it('should handle PATCH', function (done) {
    var agent = request(app)
    agent
      .patch('/movies/M1')
      .send({
        data: {
          id: 1,
          type: 'movies',
          attributes: {
            name: 'The Shawshank Redemption'
          },
          relationships: {
            categories: {
              data: [
                { type: 'categories', id: 'C1' },
                { type: 'categories', id: 'C2' },
                { type: 'categories', id: 'C3' }
              ]
            }
          }
        }
      })
      .end(function () {
        agent.get('/movieCategories').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res.body.data.length).to.equal(3)
          done()
        })
      })
  })
})

function makeData () {
  var createMovie = denodeifyCreate(Movie)
  var createCategory = denodeifyCreate(Category)
  var createAssoc = denodeifyCreate(MovieCategory)

  return RSVP.hash({
    movie: createMovie({ id: 'M1', name: 'The Shawshank Redemption' }),
    categories: RSVP.all([
      createCategory({ id: 'C1', name: 'Crime' }),
      createCategory({ id: 'C2', name: 'Drama' }),
      createCategory({ id: 'C3', name: 'History' }),
      createCategory({ id: 'C4', name: 'Comedy' })
    ])
  })
    .then(function (models) {
      return RSVP.all([
        createAssoc({
          movieId: models.movie.id,
          categoryId: models.categories[0].id
        }),
        createAssoc({
          movieId: models.movie.id,
          categoryId: models.categories[2].id
        })
      ])
    })

  function denodeifyCreate (Model) {
    return RSVP.denodeify(Model.create.bind(Model))
  }
}
