import {v2 as cloudinary} from 'cloudinary'
import productModel from '../models/productModels.js';
import fs from 'fs'


//addProduct
const addProduct = async (req, res)=>{

    console.log("working productIamge ")
   try {
    const {description, price, category, subCategory, bestSelling, newArrive, stockAvaiable } = req.body

    const image1 = req.files.image1 && req.files?.image1?.[0];
    const image2 = req.files.image2 && req.files?.image2?.[0];
    const image3 = req.files.image3 && req.files?.image3?.[0];
    const image4 = req.files.image4 && req.files?.image4?.[0];


    const images = [image1,image2,image3, image4].filter((item)=>item !== undefined);

   let imagesUrl = await Promise.all(
      images.map(async (item)=>{
         let result = await cloudinary.uploader.upload(item.path,{resource_type:
            'image'
         })
         return result.secure_url
      })
   )

   const productData = {
      image : imagesUrl,
      description,
      category,
      subCategory,
      price : Number(price),
      bestSelling : bestSelling === "true" ? true : false,
      stockAvaiable : stockAvaiable === "true" ? true :false,
      newArrive :  newArrive === "true" ? true :false,
      date : Date.now()
   }
   
    const product = new productModel(productData)

    await product.save();

    res.json({success: true, message : "Product Added"})

   } catch (error) {
    res.json({success:false, message:error.message})
   }
}

//update 
 const updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    const {
      description,
      price,
      category,
      subCategory,
      bestSelling,
      newArrive,
      stockAvaiable
    } = req.body

    const product = await productModel.findById(id)
    if (!product) {
      return res.json({ success: false, message: 'Product not found' })
    }

    /* ================= UPDATE TEXT DATA ================= */
    product.description = description
    product.price = price
    product.category = category
    product.subCategory = subCategory
    product.bestSelling = bestSelling
    product.newArrive = newArrive
    product.stockAvaiable = stockAvaiable

    
     /* ===== UPDATE IMAGE ===== */
    if (req.files?.image1) {
      const result = await cloudinary.uploader.upload(
        req.files.image1[0].path,
        { resource_type: 'image' }
      )

      // replace first image
      product.image[0] = result.secure_url
    }

    await product.save()

    res.json({
      success: true,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.log(error)
    res.json({
      success: false,
      message: error.message
    })
  }
}

//listProduct
const listProduct = async (req, res)=>{
     try {
      const products = await productModel.find({});
      res.json({success:true, products})
      
   } catch (error) {
      console.log(error)
      res.json({success:false, message:error.message})
   } 
}

//removeProduct
const removeProduct = async (req, res)=>{
    try {
      await productModel.findByIdAndDelete(req.body.id)

      res.json({success:true, message:"product Removed"})
   } catch (error) {

      console.log(error)
      res.json({success:false, message:error.message})
   }
}

export {addProduct, listProduct, removeProduct, updateProduct}