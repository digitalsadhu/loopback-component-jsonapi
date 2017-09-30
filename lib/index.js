'use strict'

const _ = require('lodash')
const headers = require('./headers')
const patch = require('./patch')
const serialize = require('./serialize')
const deserialize = require('./deserialize')
const removeRemoteMethods = require('./removeRemoteMethods')
const create = require('./create')
const update = require('./update')
const del = require('./delete')
const errors = require('./errors')
const relationships = require('./relationships')
const querystring = require('./querystring')
const debug = require('debug')('loopback-component-jsonapi')

module.exports = function (app, options) {
  const defaultOptions = {
    restApiRoot: '/api',
    enable: true,
    foreignKeys: false
  }
  options = options || {}
  options = _.defaults(options, defaultOptions)

  if (!options.enable) {
    debug('Disabled')
    return
  }
  debug('Started')
  options.debug = debug
  headers(app, options)
  removeRemoteMethods(app, options)
  patch(app, options)
  serialize(app, options)
  deserialize(app, options)
  relationships(app, options)
  create(app, options)
  update(app, options)
  errors(app, options)
  del(app, options)
  querystring(app, options)
}
