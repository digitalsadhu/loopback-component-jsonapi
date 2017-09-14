'use strict'

const request = require('supertest')
const loopback = require('loopback')
const expect = require('chai').expect
const JSONAPIComponent = require('../')
const utils = require('../lib/utilities/relationship-utils')
const updateHasMany = utils.updateHasMany
const updateHasOne = utils.updateHasOne
const updateBelongsTo = utils.updateBelongsTo
const updateHasManyThrough = utils.updateHasManyThrough
const detectUpdateStrategy = utils.detectUpdateStrategy
const linkRelatedModels = utils.linkRelatedModels

let app, ds, Post, Comment, PostComment

function startApp () {
  app = loopback()
  app.set('legacyExplorer', false)
  ds = loopback.createDataSource('memory')
  app.use(loopback.rest())
  JSONAPIComponent(app)
}

function setupHasMany () {
  Post = ds.createModel('post', { title: String })
  app.model(Post)
  Comment = ds.createModel('comment', { title: String })
  app.model(Comment)
  Post.hasMany(Comment)
}

function setupHasOne () {
  Post = ds.createModel('post', { title: String })
  app.model(Post)
  Comment = ds.createModel('comment', { title: String })
  app.model(Comment)
  Post.hasOne(Comment)
}

function setupBelongsTo () {
  Post = ds.createModel('post', { title: String })
  app.model(Post)
  Comment = ds.createModel('comment', { title: String })
  app.model(Comment)
  Comment.belongsTo(Post)
}

function setupHasManyThrough () {
  Post = ds.createModel('post', { title: String })
  app.model(Post)
  PostComment = ds.createModel('postComment', { title: String })
  app.model(PostComment)
  Comment = ds.createModel('comment', { title: String })
  app.model(Comment)
  Post.hasMany(Comment, { through: PostComment })
  Comment.hasMany(Post, { through: PostComment })
  PostComment.belongsTo(Post)
  PostComment.belongsTo(Comment)
}

describe('relationship utils', () => {
  beforeEach(() => {
    startApp()
  })

  describe('Ensure correct hasMany model linkages updated', function () {
    it('should update model linkages', () => {
      setupHasMany()
      const payload = {
        data: {
          type: 'posts',
          attributes: { title: 'my post', content: 'my post content' },
          relationships: {
            comments: {
              data: [
                { type: 'comments', id: 2 },
                { type: 'comments', id: 3 },
                { type: 'comments', id: 4 }
              ]
            }
          }
        }
      }
      return Comment.create([{ postId: 1 }, { postId: 1 }, { postId: 1 }, {}])
        .then(() => {
          return request(app)
            .post('/posts')
            .send(payload)
            .set('Accept', 'application/vnd.api+json')
            .set('Content-Type', 'application/json')
            .then(res => Comment.find({ where: { postId: res.body.data.id } }))
            .then(comments => {
              expect(comments.length).to.equal(3)
              expect(comments[0].id).to.equal(2)
              expect(comments[1].id).to.equal(3)
              expect(comments[2].id).to.equal(4)
            })
        })
    })
  })

  describe('updateHasMany()', function () {
    it('should update model linkages', () => {
      setupHasMany()
      return Comment.create([{ postId: 1 }, { postId: 1 }, { postId: 1 }, {}])
        .then(() => updateHasMany('id', 1, Comment, 'postId', [2, 3, 4]))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(3)
          expect(comments[0].id).to.equal(2)
          expect(comments[1].id).to.equal(3)
          expect(comments[2].id).to.equal(4)
        })
    })
  })

  describe('updateHasOne()', function () {
    it('should update model linkages', () => {
      setupHasOne()
      return Comment.create([{}, {}])
        .then(() => updateHasOne('id', 1, Comment, 'postId', 1))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(1)
          expect(comments[0].id).to.equal(1)
        })
    })
  })

  describe('updateBelongsTo()', function () {
    it('should update model linkages', () => {
      setupBelongsTo()
      return Comment.create({}, {})
        .then(() => updateBelongsTo(Comment, 'id', 1, 'postId', 1))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(1)
          expect(comments[0].id).to.equal(1)
        })
    })
  })

  describe('updateHasManyThrough()', function () {
    it('should update model linkages', () => {
      setupHasManyThrough()
      return Promise.all([
        Post.create({}),
        Comment.create([{}, {}, {}, {}]),
        PostComment.create([
            { postId: 1, commentId: 1 },
            { postId: 1, commentId: 2 },
            { postId: 1, commentId: 3 }
        ])
      ])
        .then(
          () =>
            updateHasManyThrough(
              'id',
              1,
              PostComment,
              'postId',
              'commentId',
              'id',
              [2, 3, 4]
            )
        )
        .then(() => PostComment.find({ where: { postId: 1 } }))
        .then(postComments => {
          expect(postComments.length).to.equal(3)
          expect(postComments[0].id).to.equal(2)
          expect(postComments[1].id).to.equal(3)
          expect(postComments[2].id).to.equal(4)
        })
    })
  })

  describe('linkRelatedModels()', function () {
    it('belongsTo', () => {
      setupBelongsTo()
      return Comment.create({}, {})
        .then(() => linkRelatedModels('post', Comment, 1, Post, 1))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(1)
          expect(comments[0].id).to.equal(1)
        })
    })
    it('hasMany', () => {
      setupHasMany()
      return Comment.create([{ postId: 1 }, { postId: 1 }, { postId: 1 }, {}])
        .then(() => linkRelatedModels('comments', Post, 1, Comment, [2, 3, 4]))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(3)
          expect(comments[0].id).to.equal(2)
          expect(comments[1].id).to.equal(3)
          expect(comments[2].id).to.equal(4)
        })
    })
    it('hasManyThrough', () => {
      setupHasManyThrough()
      return Promise.all([
        Post.create({}),
        Comment.create([{}, {}, {}, {}]),
        PostComment.create([
            { postId: 1, commentId: 1 },
            { postId: 1, commentId: 2 },
            { postId: 1, commentId: 3 }
        ])
      ])
        .then(() => linkRelatedModels('comments', Post, 1, Comment, [2, 3, 4]))
        .then(() => PostComment.find({ where: { postId: 1 } }))
        .then(postComments => {
          expect(postComments.length).to.equal(3)
          expect(postComments[0].id).to.equal(2)
          expect(postComments[1].id).to.equal(3)
          expect(postComments[2].id).to.equal(4)
        })
    })
    it('hasOne', () => {
      setupHasOne()
      return Comment.create([{}, {}])
        .then(() => linkRelatedModels('comment', Post, 1, Comment, 1))
        .then(() => Comment.find({ where: { postId: 1 } }))
        .then(comments => {
          expect(comments.length).to.equal(1)
          expect(comments[0].id).to.equal(1)
        })
    })
    it('hasOne null', () => {
      setupHasOne()
      return Comment.create([{ postId: 1 }])
        .then(() => linkRelatedModels('comment', Post, 1, Comment, null))
        .then(() => Comment.find({ where: { postId: null } }))
        .then(comments => {
          expect(comments.length).to.equal(1)
          expect(comments[0].id).to.equal(1)
        })
    })
  })

  describe('detectUpdateStrategy()', function () {
    it('hasManyThrough', () => {
      setupHasManyThrough()
      expect(detectUpdateStrategy(Post, 'comments')).to.equal(0)
    })
    it('hasMany', () => {
      setupHasMany()
      expect(detectUpdateStrategy(Post, 'comments')).to.equal(1)
    })
    it('hasOne', () => {
      setupHasOne()
      expect(detectUpdateStrategy(Post, 'comment')).to.equal(2)
    })
    it('belongsTo', () => {
      setupBelongsTo()
      expect(detectUpdateStrategy(Comment, 'post')).to.equal(3)
    })
  })
})
