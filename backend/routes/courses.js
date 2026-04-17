const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Get all published courses (for public view)
router.get('/', async (req, res) => {
    try {
        const { category, level, search } = req.query;
        // Show both published and draft courses for now
        let query = { $or: [{ status: 'published' }, { status: 'draft' }, { status: { $exists: false } }] };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        if (level && level !== 'all') {
            query.level = level;
        }
        if (search) {
            query.$and = [
                { $or: [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] }
            ];
        }
        
        const courses = await Course.find(query)
            .populate('facultyId', 'name email profilePicture')
            .sort('-createdAt');
        
        console.log(`Found ${courses.length} courses (published and draft)`); // Debug log
        console.log('Courses:', courses.map(c => ({ id: c._id, title: c.title, status: c.status }))); // Debug log
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get ALL courses for faculty dashboard (including drafts)
router.get('/all', auth, async (req, res) => {
    try {
        let query = {};
        
        // If faculty, only show their courses
        if (req.user.role === 'faculty') {
            query.facultyId = req.user.userId;
        }
        
        const courses = await Course.find(query)
            .populate('facultyId', 'name email')
            .sort('-createdAt');
        
        console.log(`Found ${courses.length} total courses for ${req.user.role}`); // Debug log
        res.json(courses);
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single course
router.get('/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate('facultyId', 'name email profilePicture bio');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add course (faculty/admin only)
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received course data:', req.body); // Debug log
        console.log('User:', req.user); // Debug log
        
        if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only faculty can create courses.' });
        }
        
        // Validate required fields
        const requiredFields = ['title', 'description', 'duration', 'price'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        }
        
        // Validate price is a number
        const price = parseFloat(req.body.price);
        if (isNaN(price)) {
            return res.status(400).json({ message: 'Price must be a valid number' });
        }
        
        const course = new Course({
            ...req.body,
            price: price,
            originalPrice: parseFloat(req.body.originalPrice) || 0,
            facultyId: req.user.userId,
            facultyName: req.user.name,
            status: 'published' // Ensure status is set to published
        });
        
        await course.save();
        console.log('Course saved successfully:', course._id); // Debug log
        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: error.message || 'Error creating course' });
    }
});

// Update course
router.put('/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        if (course.facultyId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.courseId,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete course
router.delete('/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        if (course.facultyId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        await course.deleteOne();
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Enroll in course (allows faculty to enroll in their own courses)
router.post('/:courseId/enroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if already enrolled
        if (course.students.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }
        
        // Allow enrollment (faculty can enroll in their own courses)
        course.students.push(req.user.userId);
        await course.save();
        
        console.log(`User ${req.user.userId} enrolled in course ${req.params.courseId}`);
        res.json({ message: 'Enrolled successfully', course });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Unenroll from course (students can remove themselves)
router.post('/:courseId/unenroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if student is enrolled
        const studentIndex = course.students.indexOf(req.user.userId);
        if (studentIndex === -1) {
            return res.status(400).json({ message: 'You are not enrolled in this course' });
        }
        
        // Remove student from course
        course.students.splice(studentIndex, 1);
        await course.save();
        
        console.log(`User ${req.user.userId} unenrolled from course ${req.params.courseId}`);
        res.json({ message: 'Successfully unenrolled from course', course });
    } catch (error) {
        console.error('Unenroll error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Remove student from course (faculty only - for their own courses)
router.delete('/:courseId/students/:studentId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if user is the faculty instructor
        if (course.facultyId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Only the course instructor can remove students' });
        }
        
        // Check if student is enrolled
        const studentIndex = course.students.indexOf(req.params.studentId);
        if (studentIndex === -1) {
            return res.status(400).json({ message: 'Student is not enrolled in this course' });
        }
        
        // Remove student from course
        course.students.splice(studentIndex, 1);
        await course.save();
        
        console.log(`Instructor ${req.user.userId} removed student ${req.params.studentId} from course ${req.params.courseId}`);
        res.json({ message: 'Student removed from course successfully', course });
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;