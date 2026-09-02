class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
  }
}
module.exports = AppError
