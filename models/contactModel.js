import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    userId: { type: String, default: '' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'pending' },
    isRead: { type: Boolean, default: false },
    reply: { type: String, default: '' },
    date: { type: Number, required: true }
}, { minimize: false })

const contactModel = mongoose.models.contact || mongoose.model('contact', contactSchema);

export default contactModel;
