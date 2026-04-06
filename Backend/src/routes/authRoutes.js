const express = require('express');
const { registerUser, loginUser, googleLogin } = require('../controllers/authController');

const router = express.Router();

// Jab frontend in links par request bhejega, toh upar wale functions chalenge
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

module.exports = router;