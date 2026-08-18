const  {Router}=require('express')
const authController=require("../controllers/auth.controller")
const authMiddleware=require("../middlewares/auth.middleware")

const authRouter=Router()

/** 
 *@routes POST /api/auth/register
 *@description Register a new user
 *@access public
 */ 

 authRouter.post("/register",authController.registerUserController)

 /**
 *@routes POST /api/auth/login
 *@description Login a user with email and password
 *@access public
 */ 
 authRouter.post("/login",authController.loginUserController)

 /**
 *@routes GET /api/auth/logout
 *@description CLEAR the token from the cookie and add it to the blacklist
 *@access public
 */ 
authRouter.get("/logout",authController.logoutUserController)

/**
 *@routes GET /api/auth/get-me
 *@description get the current logged in user 
*@access private
 */
authRouter.get("/get-me",authMiddleware.authUser,authController.getMeController)

module.exports=authRouter