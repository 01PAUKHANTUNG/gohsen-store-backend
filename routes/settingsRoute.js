import express from "express";
import adminAuth from "../middelware/adminAuth.js";
import settingsModel from "../models/settingsModel.js";

const settingsRouter = express.Router();

// Get settings
settingsRouter.get("/get", async (req, res) => {
    try {
        console.log("Backend: Fetching settings...");
        let settings = await settingsModel.findOne();
        console.log("Backend: Found settings in DB:", settings);
        if (!settings) {
            console.log("Backend: No settings found, creating default.");
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
        const { deliveryFee, currencies } = req.body;
        console.log("Backend received update request:", { deliveryFee, currencies });
        let settings = await settingsModel.findOne();
        if (!settings) {
            settings = new settingsModel({ deliveryFee, currencies });
        } else {
            if (deliveryFee !== undefined) settings.deliveryFee = deliveryFee;
            if (currencies !== undefined) settings.currencies = currencies;
        }
        const savedSettings = await settings.save();
        console.log("Backend saved settings:", savedSettings);
        res.json({ success: true, message: "Settings updated successfully", settings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
});

export default settingsRouter;
