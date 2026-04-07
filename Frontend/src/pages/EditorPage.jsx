import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { initSocket } from '../socket';
import toast, { Toaster } from 'react-hot-toast';
import useAppStore from '../store/useAppStore';
import '../styles/EditorPage.css';

const BOILERPLATES = {
    javascript: '// Yahan apna javascript code likhe... 🚀\nconsole.log("Hello from CollabXcode!");',
    python: '# Yahan apna python code likhe... 🚀\n\ndef main():\n    print("Hello from CollabXcode!")\n\nif __name__ == "__main__":\n    main()',
    java: '// Yahan apna java code likhe... 🚀\n// Note: Class ka naam hamesha "Main" rakhein\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from CollabXcode!");\n    }\n}',
    cpp: '// Yahan apna c++ code likhe... 🚀\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from CollabXcode!" << endl;\n    return 0;\n}'
};

const EditorPage = () => {
    const socketRef = useRef(null);
    const navigate = useNavigate();
    const { roomId } = useParams();
    
    // Global State
    const { username } = useAppStore();
    const currentUsername = username || "Guest";

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
                username: currentUsername,
            });

            // 🌟 1. Purana Save Kiya Hua Code aur Language Load Karna
            socketRef.current.on('initial-data', ({ code: savedCode, language: savedLang }) => {
                if (savedCode) setCode(savedCode);
                if (savedLang) setLanguage(savedLang);
            });

            socketRef.current.on('joined', ({ clients, username: joinedUsername, socketId }) => {
                if (joinedUsername !== currentUsername) {
                    toast.success(`${joinedUsername} ne room join kiya hai! 🎉`);
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
            });

            socketRef.current.on('disconnected', ({ socketId, username: leftUsername }) => {
                toast(`${leftUsername} room chhod kar chala gaya 🏃‍♂️`, { icon: '👋' });
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });

            // 💬 3. Chat Message Receiver
            socketRef.current.on('receive-message', ({ message, username: senderName, time }) => {
                setMessages((prev) => [...prev, { message, username: senderName, time, type: 'other' }]);
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
    }, [navigate, roomId, currentUsername]);

    const handleEditorChange = (value) => {
        setCode(value);
        socketRef.current.emit('code-change', {
            roomId,
            code: value,
        });
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        const oldLang = language;
        
        setLanguage(newLang);
        
        socketRef.current.emit('language-change', {
            roomId,
            language: newLang,
        });

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

    const sendMessage = () => {
        if (chatMessage.trim() === '') return;
        const msgData = {
            roomId,
            message: chatMessage,
            username: currentUsername,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, { ...msgData, type: 'me' }]);
        socketRef.current.emit('send-message', msgData);
        setChatMessage('');
    };

    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);

    const executeCode = async () => {
        if (!code) return;
        setIsCompiling(true);
        setOutput("Running code securely via Backend... ⏳");
        
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const response = await fetch(`${BACKEND_URL}/api/code/execute`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    stdin: input
                })
            });
            
            const data = await response.json();
            
            if (data.output) {
                setOutput(data.output);
            } else if (data.error) {
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
        <div className="editor-container">
            <Toaster position="top-right" toastOptions={{
                style: {
                    background: '#1e1e1e',
                    color: '#fff',
                    border: '1px solid #333'
                }
            }}/> 
            
            <aside className="editor-sidebar">
                <div className="sidebar-inner">
                    <h2 className="sidebar-logo">🚀 CollabXcode</h2>
                    <hr className="sidebar-divider" />
                    <h4 className="sidebar-heading">Connected Users ({clients.length})</h4>
                    
                    <div className="client-list">
                        {clients.map(client => (
                            <div key={client.socketId} className="client-item">
                                <div className="client-avatar">
                                    {client.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="client-name">{client.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sidebar-controls">
                    <button className="control-btn copy-btn" onClick={copyRoomId}>Copy Room ID</button>
                    <button className="control-btn leave-btn" onClick={leaveRoom}>Leave Room</button>
                </div>
            </aside>

            <main className="editor-wrap">
                <div className="editor-navbar">
                    <div className="lang-wrapper">
                        <span className="lang-label">Language: </span>
                        <select 
                            className="lang-select" 
                            value={language} 
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                    </div>
                    <div className="action-buttons">
                        <input type="file" id="upload-file" style={{ display: 'none' }} accept=".js,.py,.java,.cpp,.txt" onChange={handleFileUpload} />
                        <button className="action-btn secondary" onClick={() => document.getElementById('upload-file').click()}>
                            📂 Upload
                        </button>
                        <button className="action-btn secondary" onClick={handleFileDownload}>
                            💾 Download
                        </button>
                        <button 
                            className="action-btn primary"
                            onClick={executeCode}
                            disabled={isCompiling}
                        >
                            {isCompiling ? "⏳ Running..." : "▶ Run Code"}
                        </button>
                    </div>
                </div>
                
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        value={code}
                        onChange={handleEditorChange} 
                        options={{ 
                            fontSize: 16, 
                            minimap: { enabled: false }, 
                            wordWrap: "on", 
                            cursorStyle: "line",
                            padding: { top: 16 }
                        }}
                    />
                </div>

                <div className="io-container">
                    <div className="io-box">
                        <h4 className="io-heading">📥 Custom Input</h4>
                        <textarea 
                            className="io-textarea"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Apna input yahan type karein..."
                        ></textarea>
                    </div>
                    <div className="io-box">
                        <h4 className="io-heading">📤 Output</h4>
                        <pre className="io-output">
                            {output || "Output yahan aayega..."}
                        </pre>
                    </div>
                </div>
            </main>

            {/* Chat Box Element */}
            {isChatOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <h4>Room Chat</h4>
                        <button onClick={() => setIsChatOpen(false)} className="close-chat-btn">✖</button>
                    </div>
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <p style={{ color: '#64748b', textAlign: 'center', fontSize: '13px', marginTop: '20px' }}>No messages yet. Say hi! 👋</p>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`msg-wrapper ${msg.type === 'me' ? 'me' : 'other'}`}>
                                    <div className="msg-info">
                                        {msg.username} • {msg.time}
                                    </div>
                                    <div className="msg-bubble">
                                        {msg.message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="chat-input-area">
                        <input 
                            type="text" 
                            className="chat-input" 
                            placeholder="Type a message..." 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button className="chat-send-btn" onClick={sendMessage}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
            
            {!isChatOpen && (
                <div className="chat-fab" onClick={() => setIsChatOpen(true)}>
                    💬
                </div>
            )}
        </div>
    );
};

export default EditorPage;