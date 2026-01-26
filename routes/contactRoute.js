import express from "express";
import jwt from "jsonwebtoken";
import contactModel from "../models/contactModel.js";
import adminAuth from "../middelware/adminAuth.js";
import authUser from "../middelware/auth.js";

const contactRouter = express.Router();

// Route to add a new contact message
contactRouter.post("/add", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const { token } = req.headers;
        let userId = req.body.userId || "";

        if (token && !userId) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECREATE);
                userId = decoded.id;
            } catch (e) {
                // Invalid token
            }
        }

        const newContact = new contactModel({
            userId,
            name,
            email,
            subject,
            message,
            date: Date.now()
        });

        await newContact.save();
        res.json({ success: true, message: "Message sent! We'll get back to you soon." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Route for user inquiries
contactRouter.post("/user-inquiries", authUser, async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("Fetching inquiries for UID:", userId);
        const messages = await contactModel.find({ userId }).sort({ date: -1 });
        console.log("Inquiries found count:", messages.length);
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Route for admin to list all messages
contactRouter.post("/list", adminAuth, async (req, res) => {
    try {
        console.log("Admin: Fetching contact messages...");
        const messages = await contactModel.find({}).sort({ date: -1 });
        console.log("Admin: Messages found:", messages.length);
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Route for admin to reply/update status
contactRouter.post("/reply", adminAuth, async (req, res) => {
    try {
        const { id, reply, status } = req.body;
        await contactModel.findByIdAndUpdate(id, { reply, status, isRead: false });
        res.json({ success: true, message: "Reply sent and status updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Route to mark as read
contactRouter.post("/mark-read", authUser, async (req, res) => {
    try {
        const { id } = req.body;
        await contactModel.findByIdAndUpdate(id, { isRead: true });
        res.json({ success: true, message: "Marked as read" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

export default contactRouter;
