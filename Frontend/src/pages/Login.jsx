import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Login = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 1. Manual Login (Email/Password)
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert("Login Successful! 🎉");
            navigate('/'); 
        } catch (err) {
            alert(err.response?.data?.message || "Login fail ho gaya");
        }
    };

    // 2. Google Login Success
   const googleSuccess = async (response) => {
        try {
            // Google se jo token mila, use backend bhej do
            const { data } = await axios.post(`${BACKEND_URL}/api/auth/google`, { 
                token: response.credential 
            });
            
            // Backend ne confirm kar diya, ab user ko save karo
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert("Google se Login Successful! 🚀");
            navigate('/'); // Home page par bhej do
        } catch (err) {
            alert("Google Login Backend fail: " + (err.response?.data?.message || err.message));
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1 className="auth-title">🚀 CollabXcode</h1>
                <p className="auth-subtitle">Login karke coding shuru karein</p>

                <form onSubmit={handleLogin} className="auth-form">
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="auth-input" 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="auth-input" 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="auth-btn">Login</button>
                </form>

                <div className="auth-divider">
                    <span className="auth-line"></span>
                    <span className="auth-or">OR</span>
                    <span className="auth-line"></span>
                </div>

                <div className="auth-google-wrapper">
                    <GoogleLogin
                        onSuccess={googleSuccess}
                        onError={() => alert("Google Login Failed ❌")}
                    />
                </div>

                <p className="auth-footer" onClick={() => navigate('/signup')}>
                    Naya account banana hai? <span className="auth-link">Sign Up karein</span>
                </p>
            </div>
        </div>
    );
};

export default Login;