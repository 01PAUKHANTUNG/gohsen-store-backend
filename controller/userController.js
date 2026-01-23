import jwt from 'jsonwebtoken'
import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModels.js'

//Route for userLogin

const createToken = (id)=>{
  return jwt.sign({id}, process.env.JWT_SECREATE)
   }

//loginUser
const loginUser = async (req, res)=>{
   try {
    const {email, password} = req.body;
    
    const user =await userModel.findOne({email});
    
    if(!user){
      return res.json({success:false, message:"user doesn't exit yet."})
    }

    const isMatch =await bcrypt.compare(password, user.password);
   
    if(isMatch){
      const token = createToken(user.id);
      res.json({success:true , token})
    }
    else{
    res.json({success:false, message:'Incorrect Password'})}

  } catch (error) {
    console.log(error);
    res.json({success:false, message:error.message})
  }

}

//userRegister
const userRegister = async (req, res)=>{
  try {
    const {name, email, phone, password, confirmpsd} = req.body;

  
  const exits = await userModel.findOne({email});

  if(exits){
    return res.json({success:false, message: "email already exit"})
  }
 
  if(!validator.isEmail(email)){
    return res.json({success:false, message:"email is invalide"})
  }

  if(password.length<6){
    return res.json({success:false, message:"password is should contain more strong"})
  }

  if(confirmpsd !== password){
    return res.json({success:false , message :"confirm password is not same!"})
  }

  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(password, salt)


  const newUser = new userModel({email,name, password:hashPassword})

  const user = await newUser.save();

  const token = createToken(user._id)

  console.log(user)

  res.json({success:true, token})

} catch (error) {
    console.log(error)
    res.json({success:false, message : error.message})
}  
}

//adminLogin
const adminLogin = async (req, res)=>{
    try {
            const {email, password} = req.body
    
           
            if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
                 const token = jwt.sign(email+password , process.env.JWT_SECREATE)
              res.json({success:true, token})
            }else{
              res.json({success:false, message : " Wrong"})
            }
            
    
      } catch (error) {
        console.log(error)
        res.json({success:false, message : error.message})
      }
}

export {loginUser, userRegister, adminLogin}