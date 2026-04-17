const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Web Development', 'Mobile Development', 'Data Science', 'AI/ML', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'Other'],
        default: 'Web Development'
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'Beginner'
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facultyName: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String,
        default: 'https://via.placeholder.com/300x200?text=Course+Thumbnail'
    },
    syllabus: [{
        week: Number,
        title: String,
        topics: [String],
        duration: String
    }],
    requirements: [String],
    learningOutcomes: [String],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    tags: [String],
    language: {
        type: String,
        default: 'English'
    },
    certificateAvailable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published' // Changed from 'draft' to 'published'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

courseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Course', courseSchema);