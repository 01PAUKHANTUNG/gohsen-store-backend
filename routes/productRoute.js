import express from 'express'
import { addProduct, listProduct, removeProduct, updateProduct } from '../controller/productController.js';
import upload from '../middelware/multer.js';
import adminAuth from '../middelware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([{name:'image1', maxCount : 1}, {name:'image2', maxCount : 1}, {name:'image3', maxCount : 1}, {name:'image4', maxCount : 1}]), addProduct)
productRouter.get('/list', listProduct)
productRouter.post('/remove', adminAuth, removeProduct)
productRouter.put('/update/:id',adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
  ]),
  updateProduct
)

export default productRouter