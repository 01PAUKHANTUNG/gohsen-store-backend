import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 20 },
    currencies: [
        {
            country: { type: String, required: true },
            code: { type: String, required: true },
            flag: { type: String, required: true },
            unit: { type: Number, default: 1 },
            buy: { type: Number, required: true },
            sell: { type: Number, required: true },
        }
    ]
}, { timestamps: true });

export default mongoose.model("settings", settingsSchema);
