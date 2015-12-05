var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var JSONAPIComponent = require('../');
var app, Post, Comment, Author, ds;

describe('loopback json api hasMany relationships', function () {
  beforeEach(function () {
    app = loopback();
    app.set('legacyExplorer', false);
    ds = loopback.createDataSource('memory');

    Post = ds.createModel('post', {
      id: {
        type: Number,
        id: true
      },
      title: String,
      content: String
    });
    app.model(Post);

    Comment = ds.createModel('comment', {
      id: {
        type: Number,
        id: true
      },
      postId: Number,
      title: String,
      comment: String
    });
    Comment.settings.plural = 'comments';
    app.model(Comment);

    Author = ds.createModel('author', {
      id: {
        type: Number,
        id: true
      },
      firstName: String,
      lastName: String
    });
    Author.settings.plural = 'authors';
    app.model(Author);

    Post.hasMany(Comment, {
      as: 'comments',
      foreignKey: 'postId'
    });
    Post.hasOne(Author, {
      as: 'author',
      foreignKey: 'id'
    });

    app.use(loopback.rest());
    JSONAPIComponent(app, {restApiRoot: '/'});
  });

  describe('Requesting multiple via `includes` should return relationships', function (done) {
    beforeEach(function (done) {
      Author.create({
        firstName: 'Joe',
        lastName: 'Shmoe'
      }, function (err, author) {
        expect(err).to.equal(null);
        Post.create({
          title: 'my post',
          content: 'my post content'
        }, function (err, post) {
          expect(err).to.equal(null);
          post.comments.create({
            title: 'My comment',
            comment: 'My comment text'
          }, function () {
            post.comments.create({
              title: 'My second comment',
              comment: 'My second comment text'
            }, done);
          });
        });
      });
    });

    it('should return stuff', function (done) {
      request(app).get('/posts/1/?include=author,comments')
        .expect(200)
        .end(function (err, res) {
          expect(err).to.equal(null);
          //expect(res.body.data.id).to.equal('1');
          expect(res.body.data.type).to.equal('posts');
          expect(res.body.data.relationships).to.be.a('object');
          expect(res.body.data.relationships.author).to.be.a('object');
          expect(res.body.data.relationships.comments).to.be.a('object');
          expect(res.body.data.attributes).to.deep.equal({
            title: 'my post',
            content: 'my post content',
            author: 1,
            comments: [1, 2]
          });
          expect(res.body.included).to.be.an('array');
          expect(res.body.included.length).to.equal(3);
          expect(res.body.included[0]).to.deep.equal({
            id: '1',
            type: 'author',
            attributes: {
              firstName: 'Joe',
              lastName: 'Shmoe'
            }
          });
          expect(res.body.included[1]).to.deep.equal({
            id: '1',
            type: 'comments',
            attributes: {
              postId: 1,
              title: 'My comment',
              comment: 'My comment text'
            }
          });
          expect(res.body.included[2]).to.deep.equal({
            id: '2',
            type: 'comments',
            attributes: {
              postId: 1,
              title: 'My second comment',
              comment: 'My second comment text'
            }
          });
          done();
        });
    });
  });
});
