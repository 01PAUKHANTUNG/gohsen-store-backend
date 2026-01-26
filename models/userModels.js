import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, requrie: true },
    email: { type: String, requrie: true, unique: true },
    password: { type: String, requrie: true },
    phone: { type: String, requrie: true },
    cartData: { type: Array, default: [] }
  },
  { minimize: false }
)

const userModel = mongoose.model.users || mongoose.model("users", userSchema)

export default userModel
