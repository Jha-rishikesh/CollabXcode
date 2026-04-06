import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    
    // Deployment ke liye Dynamic URL (Vercel me kaam aayega), warna local ke liye 5000
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    return io(BACKEND_URL, options);
};