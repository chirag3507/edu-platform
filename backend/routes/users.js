const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all faculties
router.get('/faculties', async (req, res) => {
    try {
        const faculties = await User.find({ role: 'faculty' }).select('-password');
        res.json(faculties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user profile (current user) - MUST come before /:userId
router.get('/profile/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, bio, phone, location, website, interests, socialLinks } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (phone !== undefined) user.phone = phone;
        if (location !== undefined) user.location = location;
        if (website !== undefined) user.website = website;
        if (interests) user.interests = interests;
        if (socialLinks) user.socialLinks = socialLinks;
        
        await user.save();
        
        const updatedUser = await User.findById(req.user.userId).select('-password');
        
        res.json({ 
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get real user stats from database
router.get('/:userId/stats', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let stats = {
            coursesCompleted: 0,
            totalCourses: 0,
            messagesSent: 0,
            certificates: 0
        };
        
        if (user.role === 'student') {
            // Get enrolled courses
            const enrolledCourses = await Course.find({ students: userId });
            stats.totalCourses = enrolledCourses.length;
            
            // For completed courses (you can add a completion status field)
            stats.coursesCompleted = enrolledCourses.filter(c => c.completed).length || 0;
            
            // Get messages sent by this student
            const messagesSent = await Message.countDocuments({ senderId: userId });
            stats.messagesSent = messagesSent;
            
            // Certificates (if you have a Certificate model)
            // stats.certificates = await Certificate.countDocuments({ userId: userId });
            
        } else if (user.role === 'faculty') {
            // Get courses created by faculty
            const facultyCourses = await Course.find({ facultyId: userId });
            stats.totalCourses = facultyCourses.length;
            
            // Get total students across all courses
            let totalStudents = 0;
            facultyCourses.forEach(course => {
                totalStudents += course.students.length;
            });
            stats.totalStudents = totalStudents;
            
            // Get messages sent by faculty
            const messagesSent = await Message.countDocuments({ senderId: userId });
            stats.messagesSent = messagesSent;
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get real user activity from database
router.get('/:userId/activity', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const activity = [];
        
        // Get recent course enrollments
        const enrolledCourses = await Course.find({ students: userId })
            .sort('-createdAt')
            .limit(5);
        
        enrolledCourses.forEach(course => {
            activity.push({
                action: `Enrolled in course: ${course.title}`,
                date: course.createdAt,
                type: 'enrollment'
            });
        });
        
        // Get recent messages
        const recentMessages = await Message.find({ 
            $or: [{ senderId: userId }, { receiverId: userId }]
        })
        .sort('-timestamp')
        .limit(5);
        
        recentMessages.forEach(message => {
            activity.push({
                action: `Sent a message`,
                date: message.timestamp,
                type: 'chat'
            });
        });
        
        // Sort by date (most recent first)
        activity.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json(activity.slice(0, 10)); // Return last 10 activities
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.json([]); // Return empty array on error
    }
});

// Get students for a specific faculty (based on course enrollment)
router.get('/faculty/:facultyId/students', auth, async (req, res) => {
    try {
        const courses = await Course.find({ facultyId: req.params.facultyId }).populate('students', '-password');
        const students = [];
        courses.forEach(course => {
            course.students.forEach(student => {
                if (!students.find(s => s._id.equals(student._id))) {
                    students.push(student);
                }
            });
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get enrolled courses for a student
router.get('/student/:studentId/courses', auth, async (req, res) => {
    try {
        const courses = await Course.find({ students: req.params.studentId })
            .populate('facultyId', 'name email');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user by ID (generic route - must come last)
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;