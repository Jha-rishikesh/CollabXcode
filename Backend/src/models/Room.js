const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    roomName: { type: String, default: "Mera Naya Room" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Kis user ka room hai
    code: { type: String, default: "" }, // Room ka bacha hua code
    language: { type: String, default: "javascript" }
}, { timestamps: true });

// Isse replace kar do:
module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);