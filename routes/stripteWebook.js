import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModels.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const stripeWebhook = async (req, res) => {
    if (!stripe) {
        return res.status(500).send("Stripe not configured");
    }
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Payment success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata.orderId;

        // Update Order Status
        const order = await orderModel.findByIdAndUpdate(orderId, {
            paymentStatus: "paid"
        });

        // Clear User Cart in Backend
        if (order && order.userId) {
            await userModel.findByIdAndUpdate(order.userId, { cartData: [] });
            console.log(`Cart cleared for user ${order.userId} after successful payment.`);
        }
    }

    res.json({ received: true });
};
