import express from "express";
import { addToCart, getUserCart, removeItem, updateQuantityAdd, updateQuantityDeduct} from "../controller/cartController.js";
import authUser from "../middelware/auth.js";

const cartRouter = express.Router();

cartRouter.post('/add', authUser, addToCart)
cartRouter.post('/get', authUser, getUserCart)
cartRouter.post('/deduct', authUser, updateQuantityDeduct)
cartRouter.post('/plus', authUser, updateQuantityAdd)
cartRouter.post('/remove', authUser, removeItem)


export default cartRouter
