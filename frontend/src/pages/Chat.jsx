import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

function Chat() {
    const { userId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [receiver, setReceiver] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(false);
    const socketRef = useRef();
    const messagesEndRef = useRef();
    const typingTimeoutRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        // Connect to socket
        socketRef.current = io('http://localhost:5000');
        
        // Emit user online
        socketRef.current.emit('userOnline', user.id);
        
        // Listen for online users update
        socketRef.current.on('updateOnlineUsers', (users) => {
            setOnlineUsers(users);
        });
        
        // Listen for new messages
        socketRef.current.on('receiveMessage', (message) => {
            if ((message.senderId === userId && message.receiverId === user.id) ||
                (message.senderId === user.id && message.receiverId === userId)) {
                setMessages(prev => [...prev, message]);
            }
        });
        
        // Listen for typing indicator
        socketRef.current.on('userTyping', (data) => {
            if (data.senderId === userId) {
                setUserTyping(data.isTyping);
            }
        });
        
        fetchMessages();
        fetchReceiver();
        
        return () => {
            socketRef.current.disconnect();
        };
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/messages/${userId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchReceiver = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
            setReceiver(response.data);
        } catch (error) {
            console.error('Error fetching receiver:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        const messageData = {
            senderId: user.id,
            receiverId: userId,
            message: newMessage,
            timestamp: new Date(),
            read: false
        };
        
        try {
            const response = await axios.post('http://localhost:5000/api/messages', messageData);
            const savedMessage = response.data;
            socketRef.current.emit('sendMessage', savedMessage);
            setMessages([...messages, savedMessage]);
            setNewMessage('');
            
            // Stop typing indicator
            handleStopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            socketRef.current.emit('typing', {
                senderId: user.id,
                receiverId: userId,
                isTyping: true
            });
        }
        
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 1000);
    };
    
    const handleStopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            socketRef.current.emit('typing', {
                senderId: user.id,
                receiverId: userId,
                isTyping: false
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isUserOnline = onlineUsers.includes(userId);

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-0">Chat with {receiver?.name}</h4>
                            {isUserOnline ? (
                                <small className="text-success">● Online</small>
                            ) : (
                                <small className="text-muted">● Offline</small>
                            )}
                        </div>
                        <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>Back</button>
                    </div>
                </div>
                <div className="card-body" style={{ height: '500px', overflowY: 'auto' }}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`mb-3 ${msg.senderId === user.id ? 'text-end' : 'text-start'}`}>
                            <div className={`d-inline-block p-3 rounded ${msg.senderId === user.id ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                                 style={{ maxWidth: '70%' }}>
                                {msg.message}
                            </div>
                            <br />
                            <small className="text-muted">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </small>
                        </div>
                    ))}
                    {userTyping && (
                        <div className="text-start">
                            <small className="text-muted">{receiver?.name} is typing...</small>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="card-footer">
                    <form onSubmit={sendMessage} className="d-flex">
                        <input
                            type="text"
                            className="form-control me-2"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyUp={handleTyping}
                            placeholder="Type your message..."
                        />
                        <button type="submit" className="btn btn-primary">Send</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Chat;