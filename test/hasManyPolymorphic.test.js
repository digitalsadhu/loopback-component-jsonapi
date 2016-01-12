var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app;
var ds;
var Post;
var File;

describe('loopback json api hasMany polymorphic relationships', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    ds = loopback.createDataSource('memory');

    File = ds.createModel('file', {
      id: {type: Number, id: true},
      fileName: String,
      parentId: Number,
      parentType: String
    });
    File.settings.plural = 'files';
    app.model(File);

    Post = ds.createModel('post', {
      id: {type: Number, id: true},
      title: String,
      content: String
    });
    Post.settings.plural = 'posts';
    Post.hasMany(File, {
      as: 'files',
      polymorphic: 'parent'
    });
    app.model(Post);

    app.use(loopback.rest());
    JSONAPIComponent(app);
  });

  describe('Post hasMany Files', function () {
    beforeEach(function (done) {
      Post.create({
        title: 'Post One',
        content: 'Content'
      }, function (err, post) {
        expect(err).to.equal(null);
        post.files.create({
          fileName: 'blah.jpg',
          parentId: post.id,
          parentType: 'post'
        }, done);
      });
    });

    it('should have a relationship to Files', function (done) {
      request(app).get('/posts/1')
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.not.have.key('errors');
          expect(res.body.data.relationships.files).to.be.an('object');
          done();
        });
    });

    it('should return the Files that belong to this Post when included flag is present', function (done) {
      request(app).get('/posts/1?include=files')
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.not.have.key('errors');
          expect(res.body.included).to.be.an('array');
          expect(res.body.included[0].type).to.equal('files');
          expect(res.body.included[0].id).to.equal('1');
          done();
        });
    });

    it('should return the Files that belong to this Post when following the relationship link', function (done) {
      request(app).get('/posts/1')
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.not.have.key('errors');
          request(app).get(res.body.data.relationships.files.links.related.split('api')[1])
            .end(function (err, res) {
              expect(err).to.equal(null);
              expect(res.body).to.not.have.key('errors');
              expect(res.body.data).to.be.an('array');
              expect(res.body.data[0].type).to.equal('files');
              expect(res.body.data[0].id).to.equal('1');
              done();
            });
        });
    });
  });
});
