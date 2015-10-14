var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app, Post;

describe('loopback json api remote methods', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    var ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    });
    Post.greet = function (msg, cb) {
      cb(null, 'Greetings... ' + msg);
    };
    Post.remoteMethod(
        'greet',
      {
        accepts: {arg: 'msg', type: 'string'},
        returns: {arg: 'greeting', type: 'string'}
      }
    );
    app.model(Post);
    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('status codes', function () {
    it('POST /models should return a 201 CREATED status code', function (done) {
      request(app).post('/posts')
        .send({'msg': 'John'})
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.equal('Greetings... John!');
          done();
        });
    });
  });
});
