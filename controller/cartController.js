import userModel from "../models/userModels.js";


const addToCart = async (req, res) => {
  try {
    const { userId, id, quantity, price } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData ;

    const total = Number(price) * Number(quantity);

    const index = cartData.findIndex(item => item.id === id);
   
    if (index > -1) {
      cartData[index].quantity += quantity;
      cartData[index].total += total;
    } else {
      cartData.push({
        id,
        quantity,
        price,
        total
      });
    } 

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({success: true,message: "Added To Cart", cartData});

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//get user cart data
const getUserCart = async(req, res)=>{
   try {
    const {userId} = req.body;

    const userData = await userModel.findById(userId)
    let cartData =  userData.cartData;

    res.json({success:true, cartData})
   } catch (error) {
    console.log(error)
    res.json({success:false, message: error.message})
   } 
}

//deduct update
const updateQuantityDeduct = async(req, res)=>{
    try {
      const {userId, id, price, quantity} = req.body

      const userData = await userModel.findById(userId)
      let cartData =  userData.cartData;
      
      const index = cartData.findIndex(item=> item.id === id)
      if(cartData[index].quantity > 1){
        cartData[index].quantity -= 1;
        const total = Number(price) * cartData[index].quantity;
        cartData[index].total = total;
      }else{
        res.json({success:false, message : "Quantity Zero"})
      }

      await userModel.findByIdAndUpdate(userId,{cartData})
      res.json({success:true , message:"Cart Deduct", cartData})
    } catch (error) {
      console.log(error)
      res.json({success:false, message: error.message})
    }
}

//deduct update
const updateQuantityAdd = async(req, res)=>{
    try {
      const {userId, id, price, quantity} = req.body

      const userData = await userModel.findById(userId)
      let cartData =  userData.cartData;
      
      const index = cartData.findIndex(item=> item.id === id)
      if(cartData[index].quantity > 0){
        cartData[index].quantity += 1;
        const total = Number(price) * cartData[index].quantity;
        cartData[index].total = total;
      }else{
        res.json({success:false, message : "Quantity error"})
      }

      await userModel.findByIdAndUpdate(userId,{cartData})
      res.json({success:true , message:"Cart Add", cartData})
    } catch (error) {
      console.log(error)
      res.json({success:false, message: error.message})
    }
}

const removeItem = async (req, res) => {
  try {
    
    const { userId, id } = req.body;

    const userData = await userModel.findById(userId); 
    let cartData = userData.cartData;
    cartData = cartData.filter(item=> item.id !== id)

    await userModel.findByIdAndUpdate(userId,{cartData})
    res.json({ success: true, message: "Product removed",cartData});

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export {addToCart, getUserCart, updateQuantityDeduct, updateQuantityAdd, removeItem}