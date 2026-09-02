const { Router } = require('express')
const c = require('../controllers/auth.controller')
const validate = require('../middlewares/validate.middleware')
const { authUser } = require('../middlewares/auth.middleware')
const asyncHandler = require('../utils/asyncHandler')

const router = Router()
router.post('/register', validate(c.registerSchema), asyncHandler(c.registerUserController))
router.post('/login', validate(c.loginSchema), asyncHandler(c.loginUserController))
router.post('/logout', asyncHandler(c.logoutUserController))
router.get('/me', authUser, asyncHandler(c.getMeController))
router.get('/get-me', authUser, asyncHandler(c.getMeController))
module.exports = router
