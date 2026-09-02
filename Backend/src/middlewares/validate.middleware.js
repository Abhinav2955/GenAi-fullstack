const AppError = require('../utils/AppError')

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) return next(new AppError('Validation failed', 400, result.error.flatten()))
  req[source] = result.data
  next()
}
