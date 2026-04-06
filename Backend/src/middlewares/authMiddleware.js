const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // "Bearer <token>" se token nikalna
            token = req.headers.authorization.split(' ')[1];

            // Token verify karna
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // User dhoondh kar request mein attach kar dena (password hata kar)
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Token verify nahi ho paya, fir se login karein.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Aap logged in nahi hain! Token missing hai.' });
    }
};

module.exports = { protect };