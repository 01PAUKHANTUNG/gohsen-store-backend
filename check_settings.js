import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

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

const Settings = mongoose.model('settings', settingsSchema);

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB successfully!");
        const settingsList = await Settings.find({});
        console.log("--- START DB DUMP ---");
        console.log(JSON.stringify(settingsList, null, 2));
        console.log("--- END DB DUMP ---");
        process.exit();
    } catch (error) {
        console.error("Database Error:", error);
        process.exit(1);
    }
};

checkDB();
