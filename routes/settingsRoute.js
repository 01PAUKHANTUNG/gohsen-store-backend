import express from "express";
import adminAuth from "../middelware/adminAuth.js";
import settingsModel from "../models/settingsModel.js";

const settingsRouter = express.Router();

// Get settings
settingsRouter.get("/get", async (req, res) => {
    try {
        let settings = await settingsModel.findOne();
        if (!settings) {
            // Create default settings if not exists
            settings = new settingsModel({ deliveryFee: 20 });
            await settings.save();
        }
        res.json({ success: true, settings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

// Update settings (Admin)
settingsRouter.post("/update", adminAuth, async (req, res) => {
    try {
        const { deliveryFee } = req.body;
        let settings = await settingsModel.findOne();
        if (!settings) {
            settings = new settingsModel({ deliveryFee });
        } else {
            settings.deliveryFee = deliveryFee;
        }
        await settings.save();
        res.json({ success: true, message: "Settings updated successfully", settings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

export default settingsRouter;
