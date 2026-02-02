import express from "express";
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModels.js";
import authUser from "../middelware/auth.js";
import adminAuth from "../middelware/adminAuth.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const orderRouter = express.Router();

// Helper function to get userId if token exists
const getUserIdFromToken = (req) => {
    const { token } = req.headers;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECREATE);
        return decoded.id;
    } catch (error) {
        return null;
    }
};

import jwt from 'jsonwebtoken';

// Placing order using COD Method
orderRouter.post("/place", async (req, res) => {
    try {
        const { items, address, amount } = req.body;
        const userId = getUserIdFromToken(req);

        // console.log("COD Order Request received. Total:", amount, "User:", userId || "Guest");

        const orderData = {
            userId, // will be null for guest
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

        // Clear Cart on Backend ONLY if user resides
        if (userId) {
            await userModel.findByIdAndUpdate(userId, { cartData: [] });
            //console.log("Cart cleared for user:", userId);
        }

        //console.log("COD Order saved");

        res.json({ success: true, message: "Order Placed Successfully", order: newOrder });

    } catch (error) {
        console.error("COD Order Error:", error);
        res.json({ success: false, message: error.message });
    }
});

// Placing order using Stripe Method (Embedded Form)
orderRouter.post("/stripe-intent", async (req, res) => {
    try {
        const { items, address, amount } = req.body;
        const userId = getUserIdFromToken(req);

        if (!stripe) {

            console.warn("⚠️ Stripe key missing - Using SIMULATED SUCCESS for Embedded Form.");

            // 3. Tell frontend to skip directly to success
            return res.json({
                success: false,
                isSimulated: false,
                message: "Stripe key missing - Simulated Order Created"
            });
        }

        // 1️⃣ Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "aud",
            automatic_payment_methods: { enabled: true },
            metadata: { userId: userId || "guest" }
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
orderRouter.post("/stripe", async (req, res) => {
    try {
        const { items, address, amount } = req.body;
        const userId = getUserIdFromToken(req);

        console.log("Stripe Order Request received. Total:", amount, "User:", userId || "Guest");

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

            // 3. Redirect user directly to success page
            return res.json({
                success: false,
                message: "Stripe Simulated Success (No key found)",

            });
        }

        const lineItems = mappedItems.map(item => {
            return {
                price_data: {
                    currency: "aud",
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100),

                },
                quantity: item.quantity
            }
        })

        lineItems.push({
            price_data: {
                currency: "aud",
                product_data: { name: "Delivery Fee" },
                unit_amount: 2000,
            },
            quantity: 1
        })

        console.log(lineItems)
        // 2️⃣ Create Stripe session

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",

            line_items: lineItems,


            success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/order-cancel`,

            metadata: {
                orderId: order._id.toString()
            }
        });

        // 3️⃣ Save session ID
        order.stripeSessionId = session.id;
        await order.save();

        // Clear Cart on Backend
        if (userId) {
            await userModel.findByIdAndUpdate(userId, { cartData: [] });
        }
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
        //console.log("Verifying Order:", orderId, "Success:", success);

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

// Securely Verify Stripe Session
orderRouter.post('/verifyStripe', async (req, res) => {
    try {
        const { session_id } = req.body;
        const userId = getUserIdFromToken(req);

        if (!session_id || !stripe) {
            return res.json({ success: false, message: "Invalid Request or Stripe not initialized" });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (!session) {
            return res.json({ success: false, message: "Session not found" });
        }

        const orderId = session.metadata?.orderId;
        if (!orderId) {
            return res.json({ success: false, message: "Order ID missing from session metadata" });
        }

        // Fetch the order to verify ownership and existing status
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        // Security Check: If order has a user, ensure the requesting user owns it
        if (order.userId && order.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized: Order belongs to another user" });
        }

        // Idempotency: If already paid, return success immediately
        if (order.paymentStatus === 'paid') {
            return res.json({ success: true, message: "Order already paid" });
        }

        if (session.payment_status === 'paid') {
            // Update Order Status
            await orderModel.findByIdAndUpdate(orderId, { paymentStatus: "paid" });

            // Clear Cart if user
            if (userId) {
                await userModel.findByIdAndUpdate(userId, { cartData: [] });
            }

            res.json({ success: true, message: "Payment Verified Successfully", order });
        } else {
            res.json({ success: false, message: "Payment not completed" });
        }

    } catch (error) {
        console.error("Stripe Verification Error:", error);
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

        console.log("\n" + "=".repeat(60));
        console.log("📦 ORDER STATUS UPDATE REQUEST");
        console.log("=".repeat(60));

        // Fetch the order to check payment method
        const order = await orderModel.findById(orderId);

        if (!order) {
            console.log("❌ Order not found!");
            return res.json({ success: false, message: "Order not found" });
        }

        console.log("  Order ID:", orderId);
        console.log("  New Status:", status);
        console.log("  Current Payment Method:", order.paymentMethod);
        console.log("  Current Payment Status:", order.paymentStatus);
        console.log("  Current Delivery Status:", order.status);

        // Prepare update object
        const updateData = { status };

        // If status is "Delivered" and payment method is COD, mark payment as paid
        // If status is changed to anything else for COD, mark as pending
        // Check for COD case-insensitively and also check for "Cash on Delivery"
        const isCOD = order.paymentMethod && (
            order.paymentMethod.toUpperCase() === "COD" ||
            order.paymentMethod.toLowerCase().includes("cash on delivery")
        );

        console.log("  Is COD Order?", isCOD);

        if (isCOD) {
            if (status === "Delivered") {
                updateData.paymentStatus = "paid";
                console.log("  ✅ COD Order Delivered - Setting payment status to PAID");
            } else {
                updateData.paymentStatus = "pending";
                console.log("  ⏳ COD Order status changed to '" + status + "' - Setting payment status back to PENDING");
            }
        } else {
            console.log("  ℹ️  Not a COD order - Payment status unchanged");
        }

        console.log("  Update Data:", JSON.stringify(updateData, null, 2));

        // Update the order
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true });

        console.log("  ✅ Database Updated Successfully!");
        console.log("  Updated Payment Status:", updatedOrder.paymentStatus);
        console.log("  Updated Delivery Status:", updatedOrder.status);
        console.log("=".repeat(60) + "\n");

        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log("❌ ERROR:", error);
        res.json({ success: false, message: error.message });
    }
});

// Manual Payment Status Update (for COD orders)
orderRouter.post("/payment-status", adminAuth, async (req, res) => {
    try {
        const { orderId, paymentStatus } = req.body;

        console.log("\n" + "=".repeat(60));
        console.log("💳 PAYMENT STATUS UPDATE REQUEST");
        console.log("=".repeat(60));
        console.log("  Order ID:", orderId);
        console.log("  New Payment Status:", paymentStatus);

        // Validate payment status
        if (!["pending", "paid"].includes(paymentStatus)) {
            console.log("❌ Invalid payment status!");
            return res.json({ success: false, message: "Invalid payment status" });
        }

        // Update payment status
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { new: true }
        );

        if (!updatedOrder) {
            console.log("❌ Order not found!");
            return res.json({ success: false, message: "Order not found" });
        }

        console.log("  ✅ Payment Status Updated Successfully!");
        console.log("  Updated Payment Status:", updatedOrder.paymentStatus);
        console.log("=".repeat(60) + "\n");

        res.json({ success: true, message: "Payment Status Updated" });
    } catch (error) {
        console.log("❌ ERROR:", error);
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
