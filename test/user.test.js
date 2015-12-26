var request = require('supertest');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var path = require('path');
var USER_APP = path.join(__dirname, 'fixtures', 'user-app');
var app;

describe('new user registration', function () {
  beforeEach(function () {
    app = require(path.join(USER_APP, 'server/server.js'));
    JSONAPIComponent(app);
  });

  it('should create a new user and return a sideloaded accessToken', function (done) {
    request(app)
      .post('/Users')
      .send({
        data: {
          type: 'User',
          attributes: {
            email: 'foo@example.com',
            password: 'foo'
          }
        }
      })
      .set('Content-Type', 'application/json')
      .expect(201)
      .end(function (err, res) {
        expect(err).to.equal(null);
        expect(res.body).to.have.deep.property('data.id', '1');
        expect(res.body).to.have.deep.property('data.relationships.accessTokens.data[0].id');
        done();
      });
  });
});
