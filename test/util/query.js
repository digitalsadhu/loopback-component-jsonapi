var http = require('http')

module.exports = function (app) {
  return {
    post: function (path, data, options, cb) {
      var s = app.listen(function () {
        var req = http.request(
          {
            port: s.address().port,
            path: path,
            headers: options.headers || {},
            method: 'POST'
          },
          function (res) {
            res.setEncoding('utf8')
            res.rawData = ''
            res.on('data', function (chunk) {
              res.rawData += chunk
            })
            res.on('end', function () {
              res.body = JSON.parse(res.rawData)
              cb(null, res)
            })
          }
        )
        req.on('error', function (err) {
          cb(err)
        })
        var postData = JSON.stringify(data || {})
        req.write(postData)
        req.end()
      })
    }
  }
}
