require('dotenv').config(); // Sabse pehle env load karo
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// 1. Database Connect karo
connectDB(); 

// 2. MIDDLEWARES (Inka order bohot zaroori hai!)
app.use(cors()); // Sabse pehle CORS taaki frontend ki request block na ho
app.use(express.json()); // Phir JSON parser taaki hum body se data nikal sakein

// 3. ROUTES SETUP
app.use('/api/auth', require('./routes/authRoutes')); // Auth routes (Signup/Login)
app.use('/api/rooms', require('./routes/roomRoutes')); // Room routes
app.use('/api/code', require('./routes/codeRoutes')); // JDoodle Code execution routes

// 4. SOCKET.IO SETUP
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Socket logic ko call kar rahe hain
initializeSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});