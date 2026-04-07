const express = require('express');
const router = express.Router();
const { joinRoom, createRoom, getMyRooms } = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware'); 
const { validateRoomCreation, handleValidationErrors } = require('../middlewares/validationMiddleware');

router.post('/join', joinRoom);

router.post('/create', protect, validateRoomCreation, handleValidationErrors, createRoom);
router.get('/my-rooms', protect, getMyRooms); 

module.exports = router;