const multer = require('multer')

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 5MB or smaller.' : err.message })
  }
  const status = err.statusCode || 500
  if (status >= 500) console.error(`[${req.id || 'no-request-id'}]`, err)
  return res.status(status).json({
    success: false,
    message: status >= 500 && !err.isOperational ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
    requestId: req.id,
  })
}

module.exports = { notFound, errorHandler }
