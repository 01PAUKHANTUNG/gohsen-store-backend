import express from 'express'
import { adminLogin, loginUser, userRegister } from '../controller/userController.js';

const userRouter = express.Router();

userRouter.post('/login', loginUser)
userRouter.post('/register', userRegister)
userRouter.post('/admin',adminLogin)

export default userRouter