import express from 'express'
import { adminLogin, loginUser, userRegister, allUsers } from '../controller/userController.js';
import adminAuth from '../middelware/adminAuth.js';

const userRouter = express.Router();

userRouter.post('/login', loginUser)
userRouter.post('/register', userRegister)
userRouter.post('/admin', adminLogin)
userRouter.post('/all-users', adminAuth, allUsers)

export default userRouter