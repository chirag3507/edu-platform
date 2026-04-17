const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const galleryRoutes = require('./routes/gallery');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

connectDB();

app.use(cors());
app.use(express.json());

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('userOnline', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('sendMessage', async (messageData) => {
        const receiverSocketId = onlineUsers.get(messageData.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveMessage', messageData);
        }
        // Also emit to sender for confirmation
        socket.emit('messageSent', messageData);
    });

    socket.on('typing', (data) => {
        const receiverSocketId = onlineUsers.get(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', {
                senderId: data.senderId,
                isTyping: data.isTyping
            });
        }
    });

    socket.on('disconnect', () => {
        let disconnectedUser;
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUser = userId;
                onlineUsers.delete(userId);
                break;
            }
        }
        if (disconnectedUser) {
            io.emit('updateOnlineUsers', Array.from(onlineUsers.keys()));
        }
        console.log('Client disconnected');
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gallery', galleryRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});