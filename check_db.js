import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const orderSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    paymentMethod: String,
    paymentStatus: String,
    amount: Number,
    createdAt: Date
}, { strict: false });

const Order = mongoose.model('order', orderSchema);

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
        console.log("RECENT_ORDERS_START");
        orders.forEach(o => {
            console.log(`ORDER_RECORD: ID=${o._id} | Method=${o.paymentMethod} | Status=${o.paymentStatus} | Amount=${o.amount}`);
        });
        console.log("RECENT_ORDERS_END");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrders();
