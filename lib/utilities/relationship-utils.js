'use strict'

var _ = require('lodash')
var statusCodes = require('http-status-codes')
const utils = require('../utils')

const RELATION_TYPES = Object.freeze({
  HAS_MANY_THROUGH: 0,
  HAS_MANY: 1,
  HAS_ONE: 2,
  BELONGS_TO: 3
})

/* global module */
module.exports = {
  getIncludesArray: getIncludesArray,
  getInvalidIncludesError: getInvalidIncludesError,
  isRequestingIncludes: isRequestingIncludes,
  shouldIncludeRelationships: shouldIncludeRelationships,
  isLoopbackInclude: isLoopbackInclude,
  updateHasMany: updateHasMany,
  updateHasOne: updateHasOne,
  updateBelongsTo: updateBelongsTo,
  updateHasManyThrough: updateHasManyThrough,
  detectUpdateStrategy: detectUpdateStrategy,
  linkRelatedModels: linkRelatedModels
}

/**
 * Get the invalid includes error.
 * @public
 * @memberOf {RelationshipUtils}
 * @param {String} message
 * @return {Error}
 */
function getInvalidIncludesError (message) {
  var error = new Error(
    message || 'JSON API resource does not support `include`'
  )
  error.statusCode = statusCodes.BAD_REQUEST
  error.code = statusCodes.BAD_REQUEST
  error.status = statusCodes.BAD_REQUEST

  return error
}

function isLoopbackInclude (ctx) {
  return ctx.args && ctx.args.filter
}

function isJSONAPIInclude (req) {
  return _.isPlainObject(req.query) &&
    req.query.hasOwnProperty('include') &&
    req.query.include.length > 0
}

/**
 * Is the user requesting to sideload relationships?>
 * @public
 * @MemberOf {RelationshipUtils}
 * @return {Boolean}
 */
function isRequestingIncludes (ctx) {
  return isLoopbackInclude(ctx) || isJSONAPIInclude(ctx.req)
}

/**
 * Returns an array of relationships to include. Per JSON specification, they will
 * be in a comma-separated pattern.
 * @public
 * @memberOf {RelationshipUtils}
 * @param {Object} query
 * @return {Array}
 */
function getIncludesArray (query) {
  var relationships = query.include.split(',')

  return relationships.map(function (val) {
    return val.trim()
  })
}

/**
 * We should only include relationships if they are using GET
 * @public
 * @memberOf {RelationshipUtils}
 * @return {Boolean}
 */
function shouldIncludeRelationships (method) {
  return method.toLowerCase() === 'get'
}

function updateHasMany (
  leftPrimaryKey,
  leftId,
  RightModel,
  rightForeignKey,
  rightIds
) {
  return RightModel.updateAll({ [leftPrimaryKey]: { inq: rightIds } }, {
    [rightForeignKey]: leftId
  })
    .then(() => RightModel.find({ where: { [rightForeignKey]: leftId } }))
    .then(models => {
      const idsToUnset = _.difference(_.map(models, 'id'), rightIds)
      return RightModel.updateAll({ id: { inq: idsToUnset } }, {
        [rightForeignKey]: null
      })
    })
}

function updateHasOne (
  rightPrimaryKey,
  leftId,
  RightModel,
  rightForeignKey,
  rightId
) {
  return RightModel.updateAll({ [rightForeignKey]: leftId }, {
    [rightForeignKey]: null
  })
    .then(() => {
      if (rightId) {
        return RightModel.updateAll({ [rightPrimaryKey]: rightId }, {
          [rightForeignKey]: leftId
        })
      }
    })
}

function updateBelongsTo (
  LeftModel,
  leftPrimaryKey,
  leftId,
  leftForeignKey,
  rightId
) {
  if (rightId === null) {
    return LeftModel.updateAll({ [leftPrimaryKey]: leftId }, {
      [leftForeignKey]: null
    })
  }
  return LeftModel.updateAll({ [leftPrimaryKey]: leftId }, {
    [leftForeignKey]: rightId
  })
}

function updateHasManyThrough (
  leftPrimaryKey,
  leftId,
  PivotModel,
  leftForeignKey,
  rightForeignKey,
  rightPrimaryKey,
  rightIds
) {
  return PivotModel.find({ where: { [leftForeignKey]: Number(leftId) } })
    .then(models => {
      const existingIds = models.map(model => Number(model[rightForeignKey]))
      const newIds = rightIds.map(id => Number(id))
      const idsToDelete = _.difference(existingIds, newIds)
      return PivotModel.destroyAll({
        [leftForeignKey]: Number(leftId),
        [rightForeignKey]: { inq: idsToDelete }
      })
        .then(() => {
          const idsToAdd = _.difference(newIds, existingIds)
          return PivotModel.create(
            idsToAdd.map(id => ({
              [leftForeignKey]: Number(leftId),
              [rightForeignKey]: id
            }))
          )
        })
    })
}

function detectUpdateStrategy (Model, relationName) {
  const relationDefn = Model.relations[relationName]
  if (relationDefn.modelThrough) return RELATION_TYPES.HAS_MANY_THROUGH
  if (relationDefn.type === 'hasMany') return RELATION_TYPES.HAS_MANY
  if (relationDefn.type === 'hasOne') return RELATION_TYPES.HAS_ONE
  if (relationDefn.type === 'belongsTo') return RELATION_TYPES.BELONGS_TO
}

function linkRelatedModels (relationName, from, to) {
  const LeftModel = from.model
  const id = from.id
  const RightModel = to.model
  const data = to.data
  const relationDefn = LeftModel.relations[relationName]
  const strategy = detectUpdateStrategy(LeftModel, relationName)

  if (strategy === RELATION_TYPES.HAS_MANY_THROUGH) {
    const leftPrimaryKey = utils.primaryKeyForModel(LeftModel)
    const rightPrimaryKey = utils.primaryKeyForModel(RightModel)
    const PivotModel = relationDefn.modelThrough
    const leftForeignKey = relationDefn.keyTo
    const rightForeignKey = relationDefn.keyThrough
    return updateHasManyThrough(
      leftPrimaryKey,
      id,
      PivotModel,
      leftForeignKey,
      rightForeignKey,
      rightPrimaryKey,
      data
    )
  }

  if (strategy === RELATION_TYPES.HAS_MANY) {
    const leftPrimaryKey = utils.primaryKeyForModel(LeftModel)
    const rightForeignKey = relationDefn.keyTo
    return updateHasMany(leftPrimaryKey, id, RightModel, rightForeignKey, data)
  }

  if (strategy === RELATION_TYPES.HAS_ONE) {
    const rightPrimaryKey = utils.primaryKeyForModel(RightModel)
    const rightForeignKey = relationDefn.keyTo
    return updateHasOne(rightPrimaryKey, id, RightModel, rightForeignKey, data)
  }

  if (strategy === RELATION_TYPES.BELONGS_TO) {
    const leftPrimaryKey = utils.primaryKeyForModel(LeftModel)
    const leftForeignKey = relationDefn.keyFrom
    return updateBelongsTo(LeftModel, leftPrimaryKey, id, leftForeignKey, data)
  }
}
