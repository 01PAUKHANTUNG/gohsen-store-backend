import jwt from 'jsonwebtoken'

const adminAuth = async (req, res, next) => {

   try {
      const { token } = req.headers
      console.log("adminAuth: Token received:", token ? "Yes (length: " + token.length + ")" : "No")

      if (!token) {
         return res.json({ success: false, message: "Note Authorized,  Again" })
      }

      const token_decode = jwt.verify(token, process.env.JWT_SECREATE)
      console.log("adminAuth: Token decoded:", token_decode)
      console.log("adminAuth: Expected value:", process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD)


      if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
         console.log("adminAuth: Authorization FAILED")
         return res.json({ success: false, message: "Not Authorized, Login Again" })
      }
      console.log("adminAuth: Authorization SUCCESS")
      next()

   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

export default adminAuth