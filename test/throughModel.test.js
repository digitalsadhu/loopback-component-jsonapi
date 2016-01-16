var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app, User, Interest, Topic;

describe('through Model', function () {

  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');

    User = ds.createModel('user', {
      id: {type: Number, id: true},
      name: String
    });

    app.model(User);

    Topic = ds.createModel('topic', {
      id: {type: Number, id: true},
      name: String
    });

    app.model(Topic);

    Interest = ds.createModel('interest', {
      id: {type: Number, id: true}
    });

    app.model(Interest);

    User.hasMany(Topic, { through: Interest });
    Topic.hasMany(User, { through: Interest });

    Interest.belongsTo(User);
    Interest.belongsTo(Topic);

    app.use(loopback.rest());
    JSONAPIComponent(app, {restApiRoot: '/'});
  });

  it('should allow interest to be created', function (done) {

    User.create({ name: 'User 1' }, function (err, user) {
      expect(err).to.equal(null);

      Topic.create({ name: 'Topic 1'}, function (err, topic) {
        expect(err).to.equal(null);

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
            expect(err).to.equal(null);
            console.error(res.body.errors);
            expect(res).to.not.have.deep.property('body.errors');
            expect(res).to.have.deep.property('body.data.id').and.equal('1');
            done(err);
          });
      });
    });

  });

});
