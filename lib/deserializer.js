var _ = require('lodash');

function defaultBeforeDeserialize (options, cb) {
  cb(null, options);
}

function defaultDeserialize (options, cb) {
  options.result = options.data.data.attributes || {};
  cb(null, options);
}

function defaultAfterDeserialize (options, cb) {
  cb(null, options);
}

/**
 * Deserializes the requests data.
 * @public
 * @type {Function}
 * @param {Object} data The request data
 * @param {Object} serverRelations
 * @return {Object}
 */
module.exports = function deserializer (options, cb) {
  var model = options.model;

  var beforeDeserialize = (typeof model.beforeJsonApiDeserialize === 'function') ?
    model.beforeJsonApiDeserialize : defaultBeforeDeserialize;

  var deserialize = (typeof model.jsonApiDeserialize === 'function') ?
    model.jsonApiDeserialize : defaultDeserialize;

  var afterDeserialize = (typeof model.afterJsonApiDeserialize === 'function') ?
    model.afterJsonApiDeserialize : defaultAfterDeserialize;

  var deserializeOptions = _.cloneDeep(options);

  beforeDeserialize(deserializeOptions, function (err, deserializeOptions) {
    if (err) return cb(err);
    deserialize(deserializeOptions, function (err, deserializeOptions) {
      if (err) return cb(err);
      afterDeserialize(deserializeOptions, function (err, deserializeOptions) {
        if (err) return cb(err);
        return cb(null, deserializeOptions);
      });
    });
  });
};
