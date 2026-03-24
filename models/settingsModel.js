import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 20 },
    deliveryThresholdKm: { type: Number, default: 30 },
    feeBelowThreshold: { type: Number, default: 10 },
    feeAboveThreshold: { type: Number, default: 12 },
    freeDeliveryThresholdAmount: { type: Number, default: 200 },
    storeLat: { type: Number, default: 0 },
    storeLng: { type: Number, default: 0 },
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
