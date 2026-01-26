import express from "express";
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModels.js";
import authUser from "../middelware/auth.js";
import adminAuth from "../middelware/adminAuth.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const orderRouter = express.Router();

// Placing order using COD Method
orderRouter.post("/place", authUser, async (req, res) => {
    try {
        const { items, address, amount, userId } = req.body;
        console.log("COD Order Request received. Total:", amount, "User:", userId);

        const orderData = {
            userId,
            items: items.map(item => ({
                _id: item._id,
                name: item.description || item.name || "Product",
                price: item.price,
                quantity: item.quantity,
                image: Array.isArray(item.image) ? item.image[0] : item.image
            })),
            shippingAddress: address,
            amount,
            paymentMethod: "COD",
            paymentStatus: "pending",
            createdAt: Date.now()
        }

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Clear Cart on Backend
        await userModel.findByIdAndUpdate(userId, { cartData: [] });

        console.log("COD Order saved and cart cleared for user:", userId);

        res.json({ success: true, message: "Order Placed Successfully" });

    } catch (error) {
        console.error("COD Order Error:", error);
        res.json({ success: false, message: error.message });
    }
});

// Placing order using Stripe Method (Embedded Form)
orderRouter.post("/stripe-intent", authUser, async (req, res) => {
    try {
        const { items, address, amount, userId } = req.body;

        if (!stripe) {
            console.warn("⚠️ Stripe key missing - Using SIMULATED SUCCESS for Embedded Form.");

            // 1. Create Order as PAID immediately (since we are skipping the form)
            const mappedItems = items.map(item => ({
                _id: item._id,
                name: item.description || item.name || "Product",
                price: item.price,
                quantity: item.quantity,
                image: Array.isArray(item.image) ? item.image[0] : item.image
            }));

            const newOrder = new orderModel({
                userId,
                items: mappedItems,
                shippingAddress: address,
                amount,
                paymentMethod: "Stripe (Simulated)",
                paymentStatus: "paid"
            });
            await newOrder.save();

            // 2. Clear Cart
            await userModel.findByIdAndUpdate(userId, { cartData: [] });

            // 3. Tell frontend to skip directly to success
            return res.json({
                success: true,
                isSimulated: true,
                message: "Stripe key missing - Simulated Order Created"
            });
        }

        // 1️⃣ Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: { userId }
        });

        // 2️⃣ Create Pending Order
        const mappedItems = items.map(item => ({
            _id: item._id,
            name: item.description || item.name || "Product",
            price: item.price,
            quantity: item.quantity,
            image: Array.isArray(item.image) ? item.image[0] : item.image
        }));

        const newOrder = new orderModel({
            userId,
            items: mappedItems,
            shippingAddress: address,
            amount,
            paymentMethod: "Stripe (Embedded)",
            paymentStatus: "pending",
            stripeSessionId: paymentIntent.id // Reusing this field for Intent ID
        });

        await newOrder.save();

        paymentIntent.metadata.orderId = newOrder._id.toString();
        // Update intent with orderId
        await stripe.paymentIntents.update(paymentIntent.id, { metadata: { orderId: newOrder._id.toString() } });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Stripe Intent Error:", error);
        res.json({ success: false, message: error.message });
    }
});

// Placing order using Stripe Method
orderRouter.post("/stripe", authUser, async (req, res) => {
    try {
        const { items, address, amount, userId } = req.body;
        console.log("Stripe Order Request received. Total:", amount, "User:", userId);

        const mappedItems = items.map(item => ({
            _id: item._id,
            name: item.description || item.name || "Product",
            price: item.price,
            quantity: item.quantity,
            image: Array.isArray(item.image) ? item.image[0] : item.image
        }));

        // 1️⃣ Create order FIRST (pending)
        const order = await orderModel.create({
            userId,
            items: mappedItems,
            shippingAddress: address,
            amount,
            paymentMethod: "stripe",
            paymentStatus: "pending"
        });

        if (!stripe) {
            console.warn("⚠️ Stripe key missing - Using SIMULATED SUCCESS for development testing.");

            // 1. Simluate payment success in DB
            order.paymentStatus = "paid";
            await order.save();

            // 2. Clear Cart on Backend
            await userModel.findByIdAndUpdate(userId, { cartData: [] });

            // 3. Redirect user directly to success page
            return res.json({
                success: true,
                message: "Stripe Simulated Success (No key found)",
                session_url: `${process.env.FRONTEND_URL}/order-success`
            });
        }

        // 2️⃣ Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",

            line_items: mappedItems.map(item => ({
                price_data: {
                    currency: "usd",
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity
            })),

            success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/order-cancel`,

            metadata: {
                orderId: order._id.toString()
            }
        });

        // 3️⃣ Save session ID
        order.stripeSessionId = session.id;
        await order.save();

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error("Stripe Order Error:", error);
        res.status(500).json({ success: false, message: "Stripe error: " + error.message });
    }
});

// Verify Stripe Payment (Fallback for when webhooks aren't setup)
orderRouter.post("/verify-stripe", authUser, async (req, res) => {
    try {
        const { orderId, success } = req.body;
        console.log("Verifying Order:", orderId, "Success:", success);

        if (success === "true" || success === true) {
            await orderModel.findByIdAndUpdate(orderId, { paymentStatus: "paid" });
            // Clear Cart
            const { userId } = req.body;
            await userModel.findByIdAndUpdate(userId, { cartData: [] });
            res.json({ success: true, message: "Order status updated to Paid" });
        } else {
            res.json({ success: false, message: "Payment failed according to client" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Admin Panel Endpoints
orderRouter.post("/list", adminAuth, async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

orderRouter.post("/status", adminAuth, async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});



// All Orders data for Frontend
orderRouter.post("/userorders", authUser, async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("Fetching orders for userId:", userId);
        const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
        console.log("Orders found:", orders.length);
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

export default orderRouter;
