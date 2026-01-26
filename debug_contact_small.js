import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: './backend/.env' });

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URL);
    const Contact = mongoose.models.contact || mongoose.model('contact', new mongoose.Schema({}, { strict: false }));
    const m = await Contact.findOne({}).sort({ date: -1 });
    if (m) {
        const out = `ID: ${m._id}\nUID: ${m.userId}\nSTATUS: ${m.status}\nREPLY: ${m.reply}\nDATE: ${m.date}`;
        fs.writeFileSync('./backend/debug_output.txt', out);
    }
    process.exit();
};
check();
