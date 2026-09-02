const crypto = require('crypto')

function requestContext(req, res, next) {
  req.id = req.get('x-request-id') || crypto.randomUUID()
  res.setHeader('x-request-id', req.id)
  const started = Date.now()
  res.on('finish', () => {
    console.log(JSON.stringify({ requestId: req.id, method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - started }))
  })
  next()
}
module.exports = requestContext
