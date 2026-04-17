const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const auth = require('../middleware/auth');

// Get all gallery images
router.get('/', async (req, res) => {
    try {
        const images = await Gallery.find().sort('-createdAt');
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add gallery image (faculty/admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const image = new Gallery({
            ...req.body,
            uploadedBy: req.user.userId,
            uploadedByName: req.user.name
        });
        await image.save();
        res.status(201).json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete image
router.delete('/:imageId', auth, async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        if (image.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        await image.deleteOne();
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like image
router.post('/:imageId/like', auth, async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        const hasLiked = image.likedBy.includes(req.user.userId);
        if (hasLiked) {
            image.likedBy = image.likedBy.filter(id => id.toString() !== req.user.userId);
            image.likes = Math.max(0, image.likes - 1);
        } else {
            image.likedBy.push(req.user.userId);
            image.likes = (image.likes || 0) + 1;
        }
        
        await image.save();
        res.json({ likes: image.likes, likedBy: image.likedBy });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update image
router.put('/:imageId', auth, async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.imageId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        if (image.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const updatedImage = await Gallery.findByIdAndUpdate(
            req.params.imageId,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        res.json(updatedImage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;    