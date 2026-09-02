const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const db = require('../config/database')
const env = require('../config/env')
const AppError = require('../utils/AppError')
const { hashToken } = require('../middlewares/auth.middleware')

const registerSchema = z.object({
  username: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
})
const loginSchema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(1).max(128) })

function cookieOptions(withMaxAge = true) {
  const production = env.NODE_ENV === 'production'
  const options = { httpOnly: true, secure: production, sameSite: production ? 'none' : 'lax' }
  if (withMaxAge) options.maxAge = 24 * 60 * 60 * 1000
  return options
}
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: '1d' })
}

async function registerUserController(req, res) {
  const { username, email, password } = req.body
  const existing = await db.query('SELECT id FROM users WHERE username=$1 OR email=$2 LIMIT 1', [username, email])
  if (existing.rows.length) throw new AppError('Username or email is already registered.', 409)
  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await db.query(
    'INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3) RETURNING id,username,email',
    [username, email, passwordHash],
  )
  const user = rows[0]
  res.cookie('token', signToken(user), cookieOptions())
  res.status(201).json({ success: true, message: 'User registered successfully', user })
}

async function loginUserController(req, res) {
  const { email, password } = req.body
  const { rows } = await db.query('SELECT id,username,email,password_hash FROM users WHERE email=$1 LIMIT 1', [email])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new AppError('Invalid email or password.', 401)
  const safeUser = { id: user.id, username: user.username, email: user.email }
  res.cookie('token', signToken(safeUser), cookieOptions())
  res.json({ success: true, message: 'User logged in successfully', user: safeUser })
}

async function logoutUserController(req, res) {
  const token = req.cookies.token
  if (token) {
    try {
      const decoded = jwt.decode(token)
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000)
      await db.query('INSERT INTO revoked_tokens(token_hash,expires_at) VALUES($1,$2) ON CONFLICT DO NOTHING', [hashToken(token), expiresAt])
    } catch (_) {}
  }
  res.clearCookie('token', cookieOptions(false))
  res.json({ success: true, message: 'User logged out successfully' })
}

async function getMeController(req, res) {
  const { rows } = await db.query('SELECT id,username,email FROM users WHERE id=$1', [req.user.id])
  if (!rows[0]) throw new AppError('User not found.', 404)
  res.json({ success: true, user: rows[0] })
}

module.exports = { registerSchema, loginSchema, registerUserController, loginUserController, logoutUserController, getMeController }
