import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 20 },
}, { timestamps: true });

export default mongoose.model("settings", settingsSchema);
