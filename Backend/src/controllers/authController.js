const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Naya Import

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Google verification tool

// Ek chota function jo humara 'VIP Pass' (JWT Token) banayega
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. Naya Account Banana (Email/Password Signup)
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check karo ki user pehle se toh nahi hai
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Ye email pehle se registered hai dost!' });
        }

        // Password ko encrypt (hash) karo taaki database mein safe rahe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Naya user database mein save karo
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            authProvider: 'local'
        });

        // Response mein User ki details aur Token bhej do
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.log("Signup Error Detail:", error); // Ye line add karo
        res.status(500).json({ message: 'Server mein kuch gadbad hai.' });
    }
};

// 2. Login Karna (Email/Password)
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Database mein user dhoondo
        const user = await User.findOne({ email });

        // Agar user mila AUR password match ho gaya
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Email ya Password galat hai.' });
        }
    } catch (error) {
        console.log("CHUPPA ERROR YAHAN HAI ->", error); // Ye line terminal mein asli dushman dikhayegi
        res.status(500).json({ message: 'Server mein kuch gadbad hai.' });
    }
};

// 3. Google Login ka logic (Isme hum aage API keys daalenge)
const googleLogin = async (req, res) => {
    const { token } = req.body; // Frontend se Google ka token aayega

    try {
        // 1. Google se pucho ki kya ye token asli hai?
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        // 2. Token asli hai toh usme se user ki details nikal lo
        const { email, name } = ticket.getPayload();

        // 3. Check karo database mein ye user pehle se hai kya
        let user = await User.findOne({ email });

        if (!user) {
            // Agar naya user hai, toh account bana do (bina password ke kyunki Google se aaya hai)
            user = await User.create({
                username: name,
                email: email,
                password: 'google-login-no-password', // Dummy password
            });
        }

        // 4. Apna VIP Pass (JWT Token) dekar login karwa do
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.log("Google Login Error:", error);
        res.status(500).json({ message: 'Google Login verify nahi ho paya.' });
    }
};

module.exports = { registerUser, loginUser, googleLogin };