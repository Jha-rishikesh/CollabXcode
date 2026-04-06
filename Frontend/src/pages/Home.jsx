import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Backend se baat karne ke liye

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [isGuest, setIsGuest] = useState(true);
    const [savedRooms, setSavedRooms] = useState([]); // Naya state rooms save karne ke liye

    // Check karo user Guest hai ya Logged In, aur uske rooms fetch karo
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedInfo = JSON.parse(userInfo);
            setUsername(parsedInfo.username || parsedInfo.name || '');
            setIsGuest(false);

            // Backend se user ke purane rooms mangwao
            const fetchMyRooms = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${parsedInfo.token}` } };
                    const { data } = await axios.get('http://localhost:5000/api/rooms/my-rooms', config);
                    setSavedRooms(data); // Rooms ko state mein save kar lo
                } catch (err) {
                    console.log("Rooms fetch nahi ho paye", err);
                }
            };
            fetchMyRooms();
        }
    }, []);

    // Naya Room Create karna (Backend Bouncer ke sath)
    const createNewRoom = async (e) => {
        e.preventDefault();
        
        if (isGuest) {
            // Guest hai toh seedha ID bana do (Save nahi hoga)
            const id = uuidV4(); 
            setRoomId(id); 
            alert("Guest Room ID generate ho gaya! 🎉 (Ye save nahi hoga)");
        } else {
            // Logged in hai toh Backend se room banwao aur check karo
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                
                const id = uuidV4(); 
                const roomName = prompt("Apne room ka naam rakhein:", "Mera Naya Room") || "Mera Naya Room";

                // Backend ko request bhejo
                const { data } = await axios.post(
                    'http://localhost:5000/api/rooms/create',
                    { roomId: id, roomName },
                    config
                );

                setRoomId(data.roomId);
                setSavedRooms([...savedRooms, data]); // Naye room ko list mein add kar do
                alert("Naya Room ban gaya aur save ho gaya! 🎉");

            } catch (err) {
                // Agar 2 rooms se zyada ho gaye toh Bouncer yahan error dega!
                alert(err.response?.data?.message || "Room create fail ho gaya!");
            }
        }
    };

    // Room Join karna
    const joinRoom = () => {
        if (!roomId || !username) {
            alert("Bhai Room ID aur Username dono zaroori hain!");
            return;
        }
        navigate(`/editor/${roomId}`, { state: { username, isGuest } });
    };

    // Enter dabane par join
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
            setIsGuest(true);
            setUsername('');
            setSavedRooms([]); // Logout par rooms clear kar do UI se
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.navbar}>
                <h2 style={styles.logo}>🚀 CollabXcode</h2>
                <button onClick={handleAuthAction} style={isGuest ? styles.loginBtn : styles.logoutBtn}>
                    {isGuest ? "Login / Sign Up" : "Logout"}
                </button>
            </div>

            <div style={styles.mainContent}>
                {/* Left Side: Saved Rooms (Sirf tab dikhega jab user login ho) */}
                {!isGuest && (
                    <div style={styles.roomsList}>
                        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Aapke Rooms ({savedRooms.length}/2)</h3>
                        {savedRooms.length === 0 ? (
                            <p style={{ color: '#888' }}>Abhi tak koi room nahi banaya.</p>
                        ) : (
                            savedRooms.map((room) => (
                                <div 
                                    key={room.roomId} 
                                    style={styles.roomCard}
                                    onClick={() => { setRoomId(room.roomId); joinRoom(); }}
                                >
                                    <strong style={{ display: 'block', fontSize: '16px' }}>{room.roomName}</strong>
                                    <small style={{ color: '#aaa' }}>ID: {room.roomId.substring(0, 10)}...</small>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Right Side: Join/Create Box */}
                <div style={styles.box}>
                    {isGuest ? (
                        <div style={styles.guestAlert}>
                            ⚠️ <b>Guest Mode:</b> Aap room join kar sakte hain, par room save nahi hoga. Save karne ke liye login karein.
                        </div>
                    ) : (
                        <div style={styles.userAlert}>
                            ✅ <b>Welcome, {username}!</b> Aap total 2 rooms save kar sakte hain.
                        </div>
                    )}

                    <h3 style={styles.title}>Paste Invitation Room ID</h3>
                    
                    <div style={styles.form}>
                        <input
                            type="text"
                            style={styles.input}
                            placeholder="ROOM ID"
                            onChange={(e) => setRoomId(e.target.value)}
                            value={roomId}
                            onKeyUp={handleInputEnter}
                        />
                        <input
                            type="text"
                            style={styles.input}
                            placeholder="USERNAME"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            onKeyUp={handleInputEnter}
                            disabled={!isGuest} 
                        />
                        <button style={styles.joinBtn} onClick={joinRoom}>
                            JOIN ROOM
                        </button>
                    </div>

                    <p style={styles.footerText}>
                        Invitation nahi hai? &nbsp;
                        <span onClick={createNewRoom} style={styles.link}>
                            Naya Room Banao
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' },
    logo: { margin: 0, color: '#4CAF50' },
    logoutBtn: { padding: '8px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    loginBtn: { padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    mainContent: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '40px', padding: '40px', flexWrap: 'wrap' },
    roomsList: { width: '300px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    roomCard: { backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', border: '1px solid #333', transition: '0.2s' },
    box: { width: '420px', padding: '40px', backgroundColor: '#1e1e1e', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    title: { marginTop: 0, marginBottom: '20px', color: '#eee', fontSize: '18px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2d2d2d', color: '#fff', fontSize: '16px', fontWeight: 'bold' },
    joinBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#4CAF50', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    footerText: { marginTop: '25px', textAlign: 'center', color: '#888' },
    link: { color: '#4CAF50', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' },
    guestAlert: { backgroundColor: '#332b00', color: '#ffd54f', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #ffca28' },
    userAlert: { backgroundColor: '#0d3312', color: '#81c784', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #4caf50' }
};

export default Home;