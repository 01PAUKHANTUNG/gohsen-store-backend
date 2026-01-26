import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const checkMessages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");

        const contactSchema = new mongoose.Schema({
            name: String,
            email: String,
            date: Number
        }, { strict: false });

        const Contact = mongoose.models.contact || mongoose.model('contact', contactSchema);
        const messages = await Contact.find({}).sort({ date: -1 }).limit(3);
        console.log("Latest 3 Messages:");
        console.log(JSON.stringify(messages, null, 2));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkMessages();
