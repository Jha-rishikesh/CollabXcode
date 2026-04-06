const express = require('express');
const router = express.Router();
const { joinRoom, createRoom, getMyRooms } = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware'); // Middleware import kiya

router.post('/join', joinRoom);

// protect lagane se ye confirm hoga ki bina login ke koi room create ya fetch nahi kar payega
router.post('/create', protect, createRoom);
router.get('/my-rooms', protect, getMyRooms); 

module.exports = router;