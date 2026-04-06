const Room = require('../models/Room');

// 1. Tumhara purana Join Room function
const joinRoom = (req, res) => {
    const { roomId, username } = req.body;
    if (!roomId || !username) {
        return res.status(400).json({ error: "Room ID aur Username dono zaroori hain!" });
    }
    res.status(200).json({ message: "Room joined successfully", roomId, username });
};

// 2. Naya Room Create Karna (Limit Check ke sath)
const createRoom = async (req, res) => {
    try {
        const { roomId, roomName } = req.body;
        const userId = req.user.id; // Ye 'protect' middleware se aayega

        // Check karo user ke kitne rooms hain
        const roomCount = await Room.countDocuments({ owner: userId });
        
        if (roomCount >= 2) {
            return res.status(400).json({ message: 'Bhai, aap sirf 2 rooms bana sakte hain! Naya banane ke liye purana delete karein.' });
        }

        const newRoom = await Room.create({
            roomId,
            roomName: roomName || 'Mera Naya Room',
            owner: userId
        });

        res.status(201).json(newRoom);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Room banane mein error aaya' });
    }
};

// 3. User ke saare purane rooms nikalna
const getMyRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ owner: req.user.id });
        res.json(rooms);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Rooms fetch nahi ho paye' });
    }
};

module.exports = { joinRoom, createRoom, getMyRooms };