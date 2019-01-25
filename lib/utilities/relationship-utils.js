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
    if (val.indexOf('.') === -1) {
      return val.trim()
    }

    return val.split('.').reduce((acc, fieldName, idx, array) => {
      const isLast = idx === array.length - 1
      const value = isLast ? fieldName : { [fieldName]: {} }

      _.set(acc.result, acc.currentPath, value)
      acc.currentPath.push(fieldName)
      return acc
    }, {
      result: {},
      currentPath: []
    }).result
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
  leftPKName,
  leftPKValue,
  RightModel,
  rightFKName,
  rightFKValues
) {
  return RightModel.updateAll({ [leftPKName]: { inq: rightFKValues } }, {
    [rightFKName]: leftPKValue
  })
    .then(() => RightModel.find({ where: { [rightFKName]: leftPKValue } }))
    .then(models => {
      const idsToUnset = _.difference(_.map(models, 'id'), rightFKValues)
      return RightModel.updateAll({ id: { inq: idsToUnset } }, {
        [rightFKName]: null
      })
    })
}

function updateHasOne (
  rightPKName,
  leftPKValue,
  RightModel,
  rightFKName,
  rightPKId
) {
  return RightModel.updateAll({ [rightFKName]: leftPKValue }, {
    [rightFKName]: null
  })
    .then(() => {
      if (rightPKId) {
        return RightModel.updateAll({ [rightPKName]: rightPKId }, {
          [rightFKName]: leftPKValue
        })
      }
    })
}

function updateBelongsTo (
  LeftModel,
  leftPKName,
  leftPKValue,
  leftFKName,
  rightPKId
) {
  if (rightPKId === null) {
    return LeftModel.updateAll({ [leftPKName]: leftPKValue }, {
      [leftFKName]: null
    })
  }
  return LeftModel.updateAll({ [leftPKName]: leftPKValue }, {
    [leftFKName]: rightPKId
  })
}

function updateHasManyThrough (
  leftPKName,
  leftPKValue,
  PivotModel,
  leftFKName,
  rightFKName,
  rightPKName,
  rightFKValues
) {
  return PivotModel.find({ where: { [leftFKName]: leftPKValue } })
    .then(models => {
      const existingIds = models.map(model => model[rightFKName])
      const idsToDelete = _.difference(existingIds, rightFKValues)
      return PivotModel.destroyAll({
        [leftFKName]: leftPKValue,
        [rightFKName]: { inq: idsToDelete }
      })
        .then(() => {
          const idsToAdd = _.difference(rightFKValues, existingIds)
          return PivotModel.create(
            idsToAdd.map(id => ({
              [leftFKName]: leftPKValue,
              [rightFKName]: id
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
    const leftPKName = utils.primaryKeyForModel(LeftModel)
    const rightPKName = utils.primaryKeyForModel(RightModel)
    const PivotModel = relationDefn.modelThrough
    const leftFKName = relationDefn.keyTo
    const rightFKName = relationDefn.keyThrough
    return updateHasManyThrough(
      leftPKName,
      id,
      PivotModel,
      leftFKName,
      rightFKName,
      rightPKName,
      data
    )
  }

  if (strategy === RELATION_TYPES.HAS_MANY) {
    const leftPKName = utils.primaryKeyForModel(LeftModel)
    const rightFKName = relationDefn.keyTo
    return updateHasMany(leftPKName, id, RightModel, rightFKName, data)
  }

  if (strategy === RELATION_TYPES.HAS_ONE) {
    const rightPKName = utils.primaryKeyForModel(RightModel)
    const rightFKName = relationDefn.keyTo
    return updateHasOne(rightPKName, id, RightModel, rightFKName, data)
  }

  if (strategy === RELATION_TYPES.BELONGS_TO) {
    const leftPKName = utils.primaryKeyForModel(LeftModel)
    const leftFKName = relationDefn.keyFrom
    return updateBelongsTo(LeftModel, leftPKName, id, leftFKName, data)
  }
}
