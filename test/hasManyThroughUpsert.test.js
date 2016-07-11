var request = require('supertest')
var loopback = require('loopback')
var expect = require('chai').expect
var JSONAPIComponent = require('../')
var RSVP = require('rsvp')

var app
var Movie, Category, MovieCategoryAssoc

describe('hasManyThrough upsert', function () {
  beforeEach(function (done) {
    app = loopback()
    app.set('legacyExplorer', false)
    var ds = loopback.createDataSource('memory')
    // create models
    Movie = ds.createModel('movie', {
      id: {type: Number, id: true},
      name: String
    })

    Category = ds.createModel('category', {
      id: {type: Number, id: true},
      name: String
    })

    MovieCategoryAssoc = ds.createModel('movieCategoryAssoc', {
      id: {type: Number, id: true}
    })

    // add models
    app.model(Movie)
    app.model(Category)
    app.model(MovieCategoryAssoc)

    // set up relationships
    Movie.hasMany(Category, { through: MovieCategoryAssoc })
    Category.hasMany(Movie, { through: MovieCategoryAssoc })

    MovieCategoryAssoc.belongsTo(Movie)
    MovieCategoryAssoc.belongsTo(Category)
    makeData().then(done())
    app.use(loopback.rest())
    JSONAPIComponent(app, {restApiRoot: ''})
  })

  it('should make initial data', function (done) {

    request(app)
      .get('/movies/1/categories')
      .end(function (err, res) {
        expect(err).to.equal(null)
        expect(res).to.have.deep.property('body.data').and.have.property('length').and.equal(2)
        expect(res).to.have.deep.property('body.data[0]').and.have.property('attributes.name').and.equal('Crime')
        done(err)
      })
  })

  it('should handle POST', function (done) {
    var agent = request(app)
    agent
      .post('/movies')
      .send({
        'data': {
          'type': 'movies',
          'attributes': {
            'name': 'Ace Ventura: Pet Detective'
          },
          'relationships': {
            'categories': {
              'data': [
                {'type': 'categories', 'id': 4}
              ]
            }
          }
        }
      }).end(function () {
        agent.get('/movieCategoryAssocs').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res).to.have.deep.property('body.data').and.have.property('length').and.equal(3)
          done()
        })
      })
  })

  it('should handle PATCH', function (done) {
    var agent = request(app)
    agent
      .patch('/movies/1')
      .send({
        'data': {
          'id': 1,
          'type': 'movies',
          'attributes': {
            'name': 'The Shawshank Redemption'
          },
          'relationships': {
            'categories': {
              'data': [
                {'type': 'categories', 'id': 1},
                {'type': 'categories', 'id': 2},
                {'type': 'categories', 'id': 3}
              ]
            }
          }
        }
      }).end(function () {
        agent.get('/movieCategoryAssocs').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res).to.have.deep.property('body.data').and.have.property('length').and.equal(3)
          done()
        })
      })
  })

  it('should handle PATCH with less assocs', function (done) {
    var agent = request(app)
    agent
      .patch('/movies/1')
      .send({
        'data': {
          'id': 1,
          'type': 'movies',
          'attributes': {
            'name': 'The Shawshank Redemption'
          },
          'relationships': {
            'categories': {
              'data': [
                {'type': 'categories', 'id': 1},
                {'type': 'categories', 'id': 4}
              ]
            }
          }
        }
      }).end(function (err, res) {
        expect(err).to.equal(null)
        agent.get('/movieCategoryAssocs').end(function (err, res) {
          expect(err).to.equal(null)
          expect(res).to.have.deep.property('body.data').and.have.property('length').and.equal(2)

          agent.get('/movies/1/categories').end(function (err, res) {
            expect(err).to.equal(null)
            expect(res).to.have.deep.property('body.data').and.have.property('length').and.equal(2)
            expect(res).to.have.deep.property('body.data[1].attributes.name').and.equal('Comedy')
            done()
          })
        })
      })
  })
})

function makeData (done) {
  var createMovie = denodeifyCreate(Movie)
  var createCategory = denodeifyCreate(Category)
  var createAssoc = denodeifyCreate(MovieCategoryAssoc)

  return RSVP.hash({
    movie: createMovie({name: 'The Shawshank Redemption'}),
    categories: RSVP.all([
      createCategory({ name: 'Crime' }),
      createCategory({ name: 'Drama' }),
      createCategory({ name: 'History' }),
      createCategory({ name: 'Comedy' })
    ])
  })
    .then(function (models) {
      return RSVP.all([
        createAssoc({ movieId: models.movie.id, categoryId: models.categories[0].id }),
        createAssoc({ movieId: models.movie.id, categoryId: models.categories[2].id })
      ])
    })

  function denodeifyCreate (Model) {
    return RSVP.denodeify(Model.create.bind(Model))
  }
}
