const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const env = require('../config/env')
const db = require('../config/database')
const AppError = require('../utils/AppError')

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function authUser(req, res, next) {
  try {
    const token = req.cookies.token
    if (!token) return next(new AppError('Authentication required.', 401))
    const { rows } = await db.query('SELECT 1 FROM revoked_tokens WHERE token_hash=$1 AND expires_at > NOW()', [hashToken(token)])
    if (rows.length) return next(new AppError('Session has been logged out.', 401))
    req.user = jwt.verify(token, env.JWT_SECRET)
    next()
  } catch (error) {
    next(new AppError('Invalid or expired session.', 401))
  }
}

module.exports = { authUser, hashToken }
