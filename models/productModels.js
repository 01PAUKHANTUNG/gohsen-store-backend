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
     stockQuantity : {type: Number, default: 0},
     image: {type: Array, requried : true},
     date : {type: Number, requried : true},
})

const productModel = mongoose.models && mongoose.models.products ? mongoose.model('products') : mongoose.model("products", porductShema);

// Ensure stockAvaiable reflects stockQuantity
porductShema.pre('save', function (next) {
  if (this.stockQuantity <= 0) {
    this.stockAvaiable = false;
  } else {
    this.stockAvaiable = true;
  }
  next();
});

export default productModel