import React, { useEffect, useState } from 'react';
import { v4 as uuidV4 } from 'uuid'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAppStore from '../store/useAppStore';
import '../styles/Home.css';

const Home = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const navigate = useNavigate();
    
    // Using Zustand Store
    const { 
        username, setUsername, 
        isGuest, setIsGuest, 
        savedRooms, setSavedRooms, 
        roomId, setRoomId, 
        clearAuth 
    } = useAppStore();

    // Local state for input fields to avoid global re-renders on every keystroke
    const [localRoomId, setLocalRoomId] = useState('');
    const [localUsername, setLocalUsername] = useState(username || '');

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedInfo = JSON.parse(userInfo);
            const initialName = parsedInfo.username || parsedInfo.name || '';
            setUsername(initialName);
            setLocalUsername(initialName);
            setIsGuest(false);

            const fetchMyRooms = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${parsedInfo.token}` } };
                    const { data } = await axios.get(`${BACKEND_URL}/api/rooms/my-rooms`, config);
                    setSavedRooms(data);
                } catch (err) {
                    console.log("Rooms fetch nahi ho paye", err);
                }
            };
            fetchMyRooms();
        } else {
            setIsGuest(true);
        }
    }, [setUsername, setIsGuest, setSavedRooms, BACKEND_URL]);

    const createNewRoom = async (e) => {
        e.preventDefault();
        
        if (isGuest) {
            const id = uuidV4(); 
            setLocalRoomId(id); 
            alert("Guest Room ID generate ho gaya! 🎉 (Ye save nahi hoga)");
        } else {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                
                const id = uuidV4(); 
                const roomName = prompt("Apne room ka naam rakhein:", "Mera Naya Room") || "Mera Naya Room";

                const { data } = await axios.post(
                    `${BACKEND_URL}/api/rooms/create`,
                    { roomId: id, roomName },
                    config
                );

                setLocalRoomId(data.roomId);
                setSavedRooms([...savedRooms, data]);
                alert("Naya Room ban gaya aur save ho gaya! 🎉");
            } catch (err) {
                alert(err.response?.data?.message || "Room create fail ho gaya!");
            }
        }
    };

    const joinRoom = () => {
        if (!localRoomId || !localUsername) {
            alert("Bhai Room ID aur Username dono zaroori hain!");
            return;
        }
        
        // Save to global store just before navigating
        setRoomId(localRoomId);
        setUsername(localUsername);
        
        // No need to pass state via react-router anymore since it's global
        navigate(`/editor/${localRoomId}`);
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    const handleAuthAction = () => {
        if (isGuest) {
            navigate('/login'); 
        } else {
            localStorage.removeItem('userInfo'); 
            clearAuth(); // Clear global state
            setLocalUsername('');
            setLocalRoomId('');
        }
    };

    return (
        <div className="home-container">
            <header className="home-navbar">
                <h2 className="home-logo">🚀 CollabXcode</h2>
                <button 
                    onClick={handleAuthAction} 
                    className={'btn ' + (isGuest ? 'btn-primary' : 'btn-danger')}
                >
                    {isGuest ? "Login / Sign Up" : "Logout"}
                </button>
            </header>

            <main className="main-content">
                {/* Left Side: Saved Rooms */}
                {!isGuest && (
                    <div className="glass-panel rooms-list-container">
                        <h3 className="rooms-list-title">Aapke Rooms <span>({savedRooms.length}/2)</span></h3>
                        {savedRooms.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '14px' }}>Abhi tak koi room nahi banaya.</p>
                        ) : (
                            savedRooms.map((room) => (
                                <div 
                                    key={room.roomId} 
                                    className="room-card"
                                    onClick={() => { setLocalRoomId(room.roomId); joinRoom(); }}
                                >
                                    <span className="room-name">{room.roomName}</span>
                                    <span className="room-id">ID: {room.roomId.substring(0, 15)}...</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Right Side: Join/Create Box */}
                <div className="glass-panel join-box-container">
                    {isGuest ? (
                        <div className="alert-box alert-guest">
                            ⚠️ <span><b>Guest Mode:</b> Aap room join kar sakte hain, par save karne ke liye login karein.</span>
                        </div>
                    ) : (
                        <div className="alert-box alert-user">
                            ✅ <span><b>Welcome, {username}!</b> Aap total 2 rooms save kar sakte hain.</span>
                        </div>
                    )}

                    <h3 className="join-title">Paste Invitation Room ID</h3>
                    
                    <div className="input-group">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="ROOM ID"
                            onChange={(e) => setLocalRoomId(e.target.value)}
                            value={localRoomId}
                            onKeyUp={handleInputEnter}
                        />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="USERNAME"
                            onChange={(e) => setLocalUsername(e.target.value)}
                            value={localUsername}
                            onKeyUp={handleInputEnter}
                            disabled={!isGuest} 
                        />
                        <button className="btn btn-primary" style={{marginTop: '10px'}} onClick={joinRoom}>
                            JOIN ROOM
                        </button>
                    </div>

                    <p className="footer-text">
                        Invitation nahi hai? &nbsp;
                        <span onClick={createNewRoom} className="link-text">
                            Naya Room Banao
                        </span>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Home;