var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var ds;
var Post;
var File;

describe('loopback json api belongsTo polymorphic relationships', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    ds = loopback.createDataSource('memory');
    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    });
    Post.settings.plural = 'posts';
    app.model(Post);

    File = ds.createModel('file', {
      id: {type: Number, id: true},
      fileName: String,
      parentId: Number,
      parentType: String
    });
    File.settings.plural = 'files';
    File.belongsTo('parent', {
      polymorphic: {
        foreignKey: 'parentId',
        discriminator: 'parentType'
      }
    });
    app.model(File);

    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('File belonging to a Post', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'Post One',
        content: 'Content'
      }, function (err, post) {
        expect(err).to.equal(null);
        File.create({
          fileName: 'blah.jpg',
          parentId: post.id,
          parentType: 'post'
        }, done);
      });
    });

    it('should have a relationship to Post', function (done) {
      request(app).get('/files/1')
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body.errors).to.equal(undefined);
          expect(res.body.data.relationships.parent).to.be.an('object');
          done();
        });
    });
  });
});
