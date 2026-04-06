import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { initSocket } from '../socket';
import toast, { Toaster } from 'react-hot-toast';

const BOILERPLATES = {
    javascript: '// Yahan apna javascript code likhe... 🚀\nconsole.log("Hello from CollabXcode!");',
    python: '# Yahan apna python code likhe... 🚀\n\ndef main():\n    print("Hello from CollabXcode!")\n\nif __name__ == "__main__":\n    main()',
    java: '// Yahan apna java code likhe... 🚀\n// Note: Class ka naam hamesha "Main" rakhein\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from CollabXcode!");\n    }\n}',
    cpp: '// Yahan apna c++ code likhe... 🚀\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from CollabXcode!" << endl;\n    return 0;\n}'
};

const EditorPage = () => {
    const socketRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams();

    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(BOILERPLATES.javascript);

    // 💬 Chat State
    const [messages, setMessages] = useState([]);
    const [chatMessage, setChatMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            const socket = await initSocket();
            
            if (!isMounted) {
                socket.disconnect();
                return;
            }

            socketRef.current = socket;
            
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('Socket error', e);
                toast.error('Socket connection failed, try again later.');
                navigate('/');
            }

            // Backend ko batao ki room me aaya hu
            socketRef.current.emit('join', {
                roomId,
                username: location.state?.username || "Guest",
            });

            // 🌟 1. Purana Save Kiya Hua Code aur Language Load Karna
            socketRef.current.on('initial-data', ({ code: savedCode, language: savedLang }) => {
                if (savedCode) setCode(savedCode);
                if (savedLang) setLanguage(savedLang);
            });

            socketRef.current.on('joined', ({ clients, username, socketId }) => {
                if (username !== (location.state?.username || "Guest")) {
                    toast.success(`${username} ne room join kiya hai! 🎉`);
                }
                setClients(clients);
            });

            socketRef.current.on('code-change', ({ code: newCode }) => {
                if (newCode !== null) {
                    setCode(newCode);
                }
            });

            // 🌟 2. Kisi Doosre ne Language Badli toh Mere me Badlo
            socketRef.current.on('language-change', ({ language: newLang }) => {
                setLanguage(newLang);
                // (Boilerplate tabhi ayega jab samne wala code-change hit karega)
            });

            socketRef.current.on('disconnected', ({ socketId, username }) => {
                toast(`${username} room chhod kar chala gaya 🏃‍♂️`, { icon: '👋' });
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });

            // 💬 3. Chat Message Receiver
            socketRef.current.on('receive-message', ({ message, username, time }) => {
                setMessages((prev) => [...prev, { message, username, time, type: 'other' }]);
            });
        };

        init();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off('initial-data');
                socketRef.current.off('joined');
                socketRef.current.off('disconnected');
                socketRef.current.off('code-change');
                socketRef.current.off('language-change');
                socketRef.current.off('receive-message');
            }
        };
    }, [location.state, navigate, roomId]);

    const handleEditorChange = (value) => {
        setCode(value);
        socketRef.current.emit('code-change', {
            roomId,
            code: value,
        });
    };

    // 🌟 3. Jab Main Language Badlu (+ Boilerplate Lagana)
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        const oldLang = language;
        
        setLanguage(newLang);
        
        // Sabko batao mene language badli hai
        socketRef.current.emit('language-change', {
            roomId,
            language: newLang,
        });

        // Agar code pura khali hai ya pehle wali language ka default boilerplate tha
        // Agar code pura khali hai ya pehle wali language ka default boilerplate tha
        // tabhi nayi language ka boilerplate chipkao, warnna user ka code replace ho jayega galati se
        if (!code || code.trim() === BOILERPLATES[oldLang].trim()) {
            setCode(BOILERPLATES[newLang]);
            socketRef.current.emit('code-change', { roomId, code: BOILERPLATES[newLang] });
        }
    };

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room ID copy ho gaya! Apne dosto ko bhejo. 📋");
        } catch (err) {
            toast.error("Copy nahi ho paya!");
        }
    };

    const leaveRoom = () => {
        navigate('/');
    };

    // 📂 Upload Code from PC
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                setCode(content);
                socketRef.current.emit('code-change', {
                    roomId,
                    code: content,
                });
            };
            reader.readAsText(file);
        }
    };

    // 💾 Download Code to PC
    const handleFileDownload = () => {
        if (!code) return;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const extMap = { javascript: 'js', python: 'py', java: 'java', cpp: 'cpp' };
        link.download = `collabxcode_script.${extMap[language] || 'txt'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ✉️ Send Chat Message
    const sendMessage = () => {
        if (chatMessage.trim() === '') return;
        const msgData = {
            roomId,
            message: chatMessage,
            username: location.state?.username || "Guest",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, { ...msgData, type: 'me' }]);
        socketRef.current.emit('send-message', msgData);
        setChatMessage('');
    };

    // 🚀 NEW: JDoodle (via Backend) API se code run karne ka logic
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);

    const executeCode = async () => {
        if (!code) return;
        setIsCompiling(true);
        setOutput("Running code securely via Backend... ⏳");
        
        try {
            // Ab hum direct apne backend se request karenge, apna JDoodle secret secure rakhne ke liye!
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const response = await fetch(`${BACKEND_URL}/api/code/execute`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    stdin: input // User ka custom input yahan jayega
                })
            });
            
            const data = await response.json();
            
            if (data.output) {
                // Agar code theek run hua toh output dikhao
                setOutput(data.output);
            } else if (data.error) {
                // Agar code me syntax error hai
                setOutput("Error:\n" + data.error);
            } else {
                setOutput(JSON.stringify(data));
            }
        } catch (error) {
            setOutput("Network Error: Backend API se connect nahi ho paya.");
            console.error(error);
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="responsive-container" style={styles.container}>
            <Toaster position="top-right" /> 
            
            <div className="responsive-sidebar" style={styles.sidebar}>
                <div style={styles.sidebarInner}>
                    <h2 style={styles.logo}>🚀 CollabXcode</h2>
                    <hr style={styles.divider} />
                    <h4 style={styles.heading}>Connected Users ({clients.length})</h4>
                    
                    <div style={styles.clientList}>
                        {clients.map(client => (
                            <div key={client.socketId} style={styles.client}>
                                <div style={styles.avatar}>{client.username.charAt(0).toUpperCase()}</div>
                                <span style={styles.clientName}>{client.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.bottomControls}>
                    <button style={styles.copyBtn} onClick={copyRoomId}>Copy Room ID</button>
                    <button style={styles.leaveBtn} onClick={leaveRoom}>Leave Room</button>
                </div>
            </div>

            <div className="responsive-editor-wrap" style={styles.editorWrap}>
                <div style={styles.editorNavbar}>
                    <div style={styles.langWrapper}>
                        <span style={styles.langLabel}>Language: </span>
                        <select 
                            style={styles.langSelect} 
                            value={language} 
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <input type="file" id="upload-file" style={{ display: 'none' }} accept=".js,.py,.java,.cpp,.txt" onChange={handleFileUpload} />
                        <button style={{...styles.runBtn, backgroundColor: '#333'}} onClick={() => document.getElementById('upload-file').click()}>📂 Upload</button>
                        <button style={{...styles.runBtn, backgroundColor: '#333'}} onClick={handleFileDownload}>💾 Download</button>
                        <button 
                            style={isCompiling ? { ...styles.runBtn, backgroundColor: '#888' } : styles.runBtn} 
                            onClick={executeCode}
                            disabled={isCompiling}
                        >
                            {isCompiling ? "⏳ Running..." : "▶ Run Code"}
                        </button>
                    </div>
                </div>
                
                {/* Editor ab flex column me bache box me aayega */}
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        value={code}
                        onChange={handleEditorChange} 
                        options={{ fontSize: 16, minimap: { enabled: false }, wordWrap: "on", cursorStyle: "line" }}
                    />
                </div>

                {/* Neeche Input or Output ka section */}
                <div className="responsive-io-container" style={styles.ioContainer}>
                    <div className="responsive-io-box" style={styles.ioBox}>
                        <h4 style={styles.ioHeading}>📥 Custom Input</h4>
                        <textarea 
                            style={styles.ioTextarea}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Apna input yahan type karein..."
                        ></textarea>
                    </div>
                    <div className="responsive-io-box" style={styles.ioBox}>
                        <h4 style={styles.ioHeading}>📤 Output</h4>
                        <pre style={styles.outputArea}>
                            {output || "Output yahan aayega..."}
                        </pre>
                    </div>
                </div>
            </div>

            {/* 💬 Chat Box Sidebar & Floating Icon */}
            {isChatOpen && (
                <div className="responsive-chat-box" style={styles.chatBox}>
                    <div style={styles.chatHeader}>
                        <h4 style={{ margin: 0 }}>Room Chat</h4>
                        <button onClick={() => setIsChatOpen(false)} style={styles.closeChatBtn}>✖</button>
                    </div>
                    <div style={styles.messagesContainer}>
                        {messages.length === 0 ? (
                            <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>No messages yet. Say hi! 👋</p>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} style={msg.type === 'me' ? styles.myMessage : styles.otherMessage}>
                                    <small style={{ color: '#aaa', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
                                        {msg.username} • {msg.time}
                                    </small>
                                    <div style={msg.type === 'me' ? styles.myText : styles.otherText}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={styles.chatInputArea}>
                        <input 
                            type="text" 
                            style={styles.chatInput} 
                            placeholder="Type a message..." 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}
            
            {!isChatOpen && (
                <div style={styles.chatIcon} onClick={() => setIsChatOpen(true)}>
                    💬
                </div>
            )}
        </div>
    );
};

// Styling
const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff', fontFamily: 'sans-serif' },
    sidebar: { width: '250px', backgroundColor: '#0f0f0f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #333' },
    sidebarInner: { padding: '20px' },
    logo: { color: '#4CAF50', marginTop: 0, fontSize: '22px' },
    divider: { borderColor: '#333', marginBottom: '20px' },
    heading: { color: '#aaa', fontSize: '14px', letterSpacing: '1px' },
    clientList: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' },
    client: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatar: { width: '40px', height: '40px', backgroundColor: '#4CAF50', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff' },
    clientName: { fontWeight: 'bold', fontSize: '15px' },
    bottomControls: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    copyBtn: { padding: '10px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    leaveBtn: { padding: '10px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    editorWrap: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    editorNavbar: { minHeight: '60px', backgroundColor: '#1e1e1e', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #333', gap: '10px' },
    langWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
    langLabel: { color: '#aaa', fontWeight: 'bold' },
    langSelect: { padding: '8px', borderRadius: '5px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    runBtn: { padding: '8px 15px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    ioContainer: { display: 'flex', height: '40vh', borderTop: '2px solid #333', backgroundColor: '#1e1e1e' },
    ioBox: { flex: 1, dipaly: 'flex', flexDirection: 'column', borderRight: '1px solid #333', padding: '10px' },
    ioHeading: { margin: '0 0 10px 0', color: '#aaa', fontSize: '14px' },
    ioTextarea: { flex: 1, width: '100%', height: 'calc(100% - 30px)', backgroundColor: '#0f0f0f', color: '#fff', border: '1px solid #333', borderRadius: '5px', padding: '10px', fontSize: '14px', resize: 'none', outline: 'none' },
    outputArea: { flex: 1, width: '100%', height: 'calc(100% - 30px)', backgroundColor: '#0f0f0f', color: '#4CAF50', border: '1px solid #333', borderRadius: '5px', padding: '10px', fontSize: '14px', overflowY: 'auto', margin: 0, whiteSpace: 'pre-wrap' },
    chatIcon: { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 1000 },
    chatBox: { position: 'fixed', bottom: '0', right: '0', width: '350px', height: '500px', backgroundColor: '#1e1e1e', borderLeft: '1px solid #333', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', zIndex: 1001, boxShadow: '-5px 0 20px rgba(0,0,0,0.5)' },
    chatHeader: { padding: '15px', backgroundColor: '#0f0f0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' },
    closeChatBtn: { background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' },
    messagesContainer: { flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' },
    myMessage: { alignSelf: 'flex-end', maxWidth: '80%' },
    otherMessage: { alignSelf: 'flex-start', maxWidth: '80%' },
    myText: { backgroundColor: '#4CAF50', padding: '10px', borderRadius: '15px 15px 0 15px', color: 'white', fontSize: '14px' },
    otherText: { backgroundColor: '#333', padding: '10px', borderRadius: '15px 15px 15px 0', color: 'white', fontSize: '14px' },
    chatInputArea: { padding: '15px', backgroundColor: '#0f0f0f', borderTop: '1px solid #333', display: 'flex', gap: '10px' },
    chatInput: { flex: 1, padding: '10px', borderRadius: '20px', border: 'none', backgroundColor: '#333', color: 'white', outline: 'none' },
    sendBtn: { padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }
};

export default EditorPage;