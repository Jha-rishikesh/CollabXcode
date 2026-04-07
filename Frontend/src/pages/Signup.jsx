import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Signup = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 1. Manual Signup Handler
    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BACKEND_URL}/api/auth/signup`, { username, email, password });
            alert("Account ban gaya! Ab login karein. 🎉");
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Signup fail ho gaya");
        }
    };

    // 2. Google Signup/Login Handler (Same as Login page)
    const googleSuccess = async (response) => {
        try {
            const { data } = await axios.post(`${BACKEND_URL}/api/auth/google`, { 
                token: response.credential 
            });
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert("Google se Signup/Login Successful! 🚀");
            navigate('/'); // Home page bhej do
        } catch (err) {
            alert("Google Error: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2 className="auth-title">Naya Account Banao 🚀</h2>
                <p className="auth-subtitle">Join CollabXcode and code securely</p>
                
                <form onSubmit={handleSignup} className="auth-form">
                    <input type="text" placeholder="Username" className="auth-input" onChange={(e) => setUsername(e.target.value)} required />
                    <input type="email" placeholder="Email Address" className="auth-input" onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" className="auth-input" onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit" className="auth-btn">Sign Up</button>
                </form>

                <div className="auth-divider">
                    <span className="auth-line"></span>
                    <span className="auth-or">OR</span>
                    <span className="auth-line"></span>
                </div>

                <div className="auth-google-wrapper">
                    <GoogleLogin
                        onSuccess={googleSuccess}
                        onError={() => alert("Google Signup Failed ❌")}
                        theme="filled_black"
                        shape="pill"
                        text="signup_with" 
                    />
                </div>

                <p className="auth-footer" onClick={() => navigate('/login')}>
                    Pehle se account hai? <span className="auth-link">Login karein</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;