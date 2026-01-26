import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const orderSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    paymentMethod: String,
    paymentStatus: String,
    amount: Number
});
const userSchema = new mongoose.Schema({
    email: String
});

const Order = mongoose.model('order', orderSchema);
const User = mongoose.model('users', userSchema);

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const targetUser = await User.findOne({ email: 'pktung470@gmail.com' });
        if (targetUser) {
            console.log(`User Found: ${targetUser.email}, ID: ${targetUser._id}`);
            const orders = await Order.find({ userId: targetUser._id });
            console.log(`Orders for this user: ${orders.length}`);
            orders.forEach(o => {
                console.log(`- Order: ${o._id}, Status: ${o.paymentStatus}, Amount: ${o.amount}`);
            });
        } else {
            console.log("User pktung470@gmail.com not found");
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
