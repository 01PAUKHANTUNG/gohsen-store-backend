import mongoose from 'mongoose'

const porductShema = new mongoose.Schema({
     id:{type:String, requried : true},
     category : {type:String, requried : true}, 
     subCategory : {type:String, requried : true},
     description: {type:String, requried : true},
     price: {type: Number, requried : true},
     bestSelling : {type: Boolean, requried : true},
     stockAvaiable : {type: Boolean, requried : true},
     newArrive : {type: Boolean, requried : true},
     image: {type: Array, requried : true},
     date : {type: Number, requried : true},
})

const productModel = mongoose.model.products || mongoose.model("products", porductShema)

export default productModel