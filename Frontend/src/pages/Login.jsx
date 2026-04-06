import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 1. Manual Login (Email/Password)
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
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
            const { data } = await axios.post('http://localhost:5000/api/auth/google', { 
                token: response.credential 
            });
            
            // Backend ne confirm kar diya, ab user ko save karo
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert("Google se Login Successful! 🚀");
            navigate('/'); // Home page par bhej do
        } catch (err) {
            alert("Google Login Backend fail: " + err.response?.data?.message || err.message);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h1 style={styles.title}>🚀 CollabXcode</h1>
                <p style={styles.subtitle}>Login karke coding shuru karein</p>

                <form onSubmit={handleLogin} style={styles.form}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        style={styles.input} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        style={styles.input} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" style={styles.loginBtn}>Login</button>
                </form>

                <div style={styles.divider}>
                    <span style={styles.line}></span>
                    <span style={styles.or}>OR</span>
                    <span style={styles.line}></span>
                </div>

                <div style={styles.googleWrapper}>
                    <GoogleLogin
                        onSuccess={googleSuccess}
                        onError={() => alert("Google Login Failed ❌")}
                    />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' },
    loginBox: { width: '380px', padding: '40px', backgroundColor: '#1e1e1e', borderRadius: '12px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    title: { color: '#4CAF50', marginBottom: '10px' },
    subtitle: { color: '#aaa', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2d2d2d', color: '#fff' },
    loginBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#4CAF50', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
    divider: { display: 'flex', alignItems: 'center', margin: '20px 0' },
    line: { flex: 1, height: '1px', backgroundColor: '#444' },
    or: { padding: '0 10px', color: '#888' },
    googleWrapper: { display: 'flex', justifyContent: 'center' }
};

export default Login;