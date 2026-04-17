const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages between users
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user.userId, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.user.userId }
            ]
        }).sort('timestamp');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send message
router.post('/', auth, async (req, res) => {
    try {
        const message = new Message({
            senderId: req.user.userId,
            receiverId: req.body.receiverId,
            message: req.body.message
        });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;