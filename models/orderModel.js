import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

    items: [
        {
            _id: String,
            name: String,
            price: Number,
            quantity: Number,
            image: String
        }
    ],

    shippingAddress: {
        firstName: String,
        lastName: String,
        email: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
        phone: String
    },

    amount: Number,
    deliveryFee: { type: Number, default: 0 },
    paymentMethod: String,

    paymentStatus: {
        type: String,
        default: "pending" // pending | paid | failed
    },

    stripeSessionId: String,

    status: {
        type: String,
        default: "Order Placed"
    },

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("order", orderSchema);
