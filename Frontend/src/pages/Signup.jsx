import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google'; // Google tool import kiya
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        <div style={styles.container}>
            <div style={styles.box}>
                <h2 style={{color: '#4CAF50'}}>Naya Account Banao 🚀</h2>
                
                <form onSubmit={handleSignup} style={styles.form}>
                    <input type="text" placeholder="Username" style={styles.input} onChange={(e) => setUsername(e.target.value)} required />
                    <input type="email" placeholder="Email Address" style={styles.input} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" style={styles.input} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="submit" style={styles.btn}>Sign Up</button>
                </form>

                {/* Divider aur Google Button add kar diya */}
                <div style={styles.divider}>
                    <span style={styles.line}></span>
                    <span style={styles.or}>OR</span>
                    <span style={styles.line}></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={googleSuccess}
                        onError={() => alert("Google Signup Failed ❌")}
                        theme="filled_black"
                        shape="pill"
                        text="signup_with" // Ye Google button ka text "Sign up with Google" kar dega
                    />
                </div>

                <p onClick={() => navigate('/login')} style={{cursor:'pointer', color:'#aaa', marginTop:'20px'}}>
                    Pehle se account hai? <span style={{color: '#4CAF50', textDecoration: 'underline'}}>Login karein</span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f', color: '#fff' },
    box: { width: '380px', padding: '40px', backgroundColor: '#1e1e1e', borderRadius: '12px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2d2d2d', color: '#fff' },
    btn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#4CAF50', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
    divider: { display: 'flex', alignItems: 'center', margin: '20px 0' },
    line: { flex: 1, height: '1px', backgroundColor: '#444' },
    or: { padding: '0 10px', color: '#888', fontSize: '14px' }
};

export default Signup;