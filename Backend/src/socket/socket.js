const Room = require('../models/Room');

// Memory mein users ko yaad rakhne ke liye ek khali object
const userSocketMap = {}; 

// Room ke saare users ki list nikalne ka ek helper function
function getAllConnectedClients(io, roomId) {
    // Ye line room mein jitne bhi socket IDs hain unko array mein badal deti hai
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    return clients.map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId], // Har ID ke aage uska naam chipka do
        };
    });
}

const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Naya user connect hua:', socket.id);

        // 1. Jab koi user room join kare
        socket.on('join', async ({ roomId, username }) => {
            userSocketMap[socket.id] = username; // User ka naam yaad kar lo
            socket.join(roomId);

            // Database me check karo ki kya ye room save hai?
            try {
                const room = await Room.findOne({ roomId });
                if (room) {
                    // Agar room mila toh apne purane code aur language ko user tak bhej do
                    socket.emit('initial-data', {
                        code: room.code,
                        language: room.language
                    });
                }
            } catch (err) {
                console.log("Error fetching room initial data: ", err);
            }

            // Room ke saare users ki updated list nikalo
            const clients = getAllConnectedClients(io, roomId);

            // Room mein sabko batao ki koi naya aaya hai (aur list update karo)
            io.to(roomId).emit('joined', {
                clients,
                username,
                socketId: socket.id
            });
        });

        // 2. Jab koi user code type kare
        socket.on('code-change', async ({ roomId, code }) => {
            // Frontend string ki jagah { code: string } expect kar raha hai
            socket.to(roomId).emit('code-change', { code });

            // Database me save karo async aaram se
            try {
                await Room.updateOne({ roomId }, { code });
            } catch (err) {
                console.log("Code save nahi ho paya: ", err);
            }
        });

        // 2.5 Jab koi user language badle
        socket.on('language-change', async ({ roomId, language }) => {
            socket.to(roomId).emit('language-change', { language });

            // Database me save karo
            try {
                await Room.updateOne({ roomId }, { language });
            } catch (err) {
                console.log("Language save nahi ho paya: ", err);
            }
        });

        // 3. Jab koi chat message bheje
        socket.on('send-message', ({ roomId, message, username, time }) => {
            // Room me baki sabko message distribute kar do
            socket.to(roomId).emit('receive-message', {
                message,
                username,
                time
            });
        });

        // 4. Jab user 'Leave' button dabaye ya tab band kare
        socket.on('disconnecting', () => {
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                // Us room mein baaki logo ko batao ki ye user gaya
                socket.in(roomId).emit('disconnected', {
                    socketId: socket.id,
                    username: userSocketMap[socket.id]
                });
            });
            
            // Memory se jaane wale ka naam hata do
            delete userSocketMap[socket.id]; 
        });
    });
};

module.exports = initializeSocket;