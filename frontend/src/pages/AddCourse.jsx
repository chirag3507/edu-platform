import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AddCourse() {
    const [courseData, setCourseData] = useState({
        title: '',
        shortDescription: '',
        description: '',
        category: 'Web Development',
        level: 'Beginner',
        duration: '',
        price: '',
        originalPrice: '',
        thumbnail: '',
        language: 'English',
        certificateAvailable: true,
        requirements: [''],
        learningOutcomes: [''],
        tags: [],
        syllabus: [{ week: 1, title: '', topics: [''], duration: '' }]
    });
    
    const [currentTag, setCurrentTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCourseData({
            ...courseData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleRequirementChange = (index, value) => {
        const newRequirements = [...courseData.requirements];
        newRequirements[index] = value;
        setCourseData({ ...courseData, requirements: newRequirements });
    };

    const addRequirement = () => {
        setCourseData({
            ...courseData,
            requirements: [...courseData.requirements, '']
        });
    };

    const removeRequirement = (index) => {
        const newRequirements = courseData.requirements.filter((_, i) => i !== index);
        setCourseData({ ...courseData, requirements: newRequirements });
    };

    const handleOutcomeChange = (index, value) => {
        const newOutcomes = [...courseData.learningOutcomes];
        newOutcomes[index] = value;
        setCourseData({ ...courseData, learningOutcomes: newOutcomes });
    };

    const addOutcome = () => {
        setCourseData({
            ...courseData,
            learningOutcomes: [...courseData.learningOutcomes, '']
        });
    };

    const removeOutcome = (index) => {
        const newOutcomes = courseData.learningOutcomes.filter((_, i) => i !== index);
        setCourseData({ ...courseData, learningOutcomes: newOutcomes });
    };

    const handleSyllabusChange = (weekIndex, field, value) => {
        const newSyllabus = [...courseData.syllabus];
        newSyllabus[weekIndex][field] = value;
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    const handleTopicChange = (weekIndex, topicIndex, value) => {
        const newSyllabus = [...courseData.syllabus];
        newSyllabus[weekIndex].topics[topicIndex] = value;
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    const addWeek = () => {
        setCourseData({
            ...courseData,
            syllabus: [...courseData.syllabus, { week: courseData.syllabus.length + 1, title: '', topics: [''], duration: '' }]
        });
    };

    const addTopic = (weekIndex) => {
        const newSyllabus = [...courseData.syllabus];
        newSyllabus[weekIndex].topics.push('');
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    const removeWeek = (weekIndex) => {
        const newSyllabus = courseData.syllabus.filter((_, i) => i !== weekIndex);
        // Re-number weeks
        newSyllabus.forEach((week, idx) => { week.week = idx + 1; });
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    const addTag = () => {
        if (currentTag && !courseData.tags.includes(currentTag)) {
            setCourseData({
                ...courseData,
                tags: [...courseData.tags, currentTag]
            });
            setCurrentTag('');
        }
    };

    const removeTag = (tag) => {
        setCourseData({
            ...courseData,
            tags: courseData.tags.filter(t => t !== tag)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validation
            if (!courseData.title.trim()) {
                alert('Please enter a course title');
                setLoading(false);
                return;
            }
            if (!courseData.description.trim()) {
                alert('Please enter a course description');
                setLoading(false);
                return;
            }
            if (!courseData.duration.trim()) {
                alert('Please enter course duration');
                setLoading(false);
                return;
            }
            
            const price = parseFloat(courseData.price);
            if (isNaN(price) || price < 0) {
                alert('Please enter a valid price');
                setLoading(false);
                return;
            }
            
            const originalPrice = parseFloat(courseData.originalPrice) || 0;
            if (originalPrice < 0) {
                alert('Please enter a valid original price');
                setLoading(false);
                return;
            }
            
            const syllabusData = courseData.syllabus.filter(w => w.title && w.title.trim());
            if (syllabusData.length === 0) {
                alert('Please add at least one week with a title to the syllabus');
                setLoading(false);
                return;
            }
            
            const submitData = {
                ...courseData,
                price: price,
                originalPrice: originalPrice,
                requirements: courseData.requirements.filter(r => r.trim()),
                learningOutcomes: courseData.learningOutcomes.filter(o => o.trim()),
                syllabus: syllabusData
            };
            
            console.log('Submitting course data:', submitData);
            await axios.post('http://localhost:5000/api/courses', submitData);
            alert('Course created successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating course:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Failed to create course. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="card border-0 shadow-lg">
                <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h2 className="mb-0">Create New Course</h2>
                    <p className="mb-0 opacity-75">Share your knowledge with students worldwide</p>
                </div>
                <div className="card-body p-5">
                    {/* Progress Steps */}
                    <div className="row mb-5">
                        <div className="col-12">
                            <div className="d-flex justify-content-between">
                                {[1, 2, 3, 4].map(step => (
                                    <div key={step} className="text-center" style={{ flex: 1 }}>
                                        <div className={`rounded-circle bg-${currentStep >= step ? 'primary' : 'secondary'} text-white d-inline-flex align-items-center justify-content-center mb-2`}
                                             style={{ width: '40px', height: '40px' }}>
                                            {step}
                                        </div>
                                        <div className="small">
                                            {step === 1 && 'Basic Info'}
                                            {step === 2 && 'Content'}
                                            {step === 3 && 'Curriculum'}
                                            {step === 4 && 'Pricing'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                            <div className="fade-in">
                                <h3 className="mb-4">Basic Information</h3>
                                
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Course Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="form-control form-control-lg"
                                        value={courseData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Complete Web Development Bootcamp"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Short Description</label>
                                    <input
                                        type="text"
                                        name="shortDescription"
                                        className="form-control"
                                        value={courseData.shortDescription}
                                        onChange={handleChange}
                                        placeholder="Brief description (appears in course cards)"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Full Description *</label>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        rows="6"
                                        value={courseData.description}
                                        onChange={handleChange}
                                        placeholder="Detailed description of your course..."
                                        required
                                    />
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Category *</label>
                                        <select name="category" className="form-select" value={courseData.category} onChange={handleChange}>
                                            <option>Web Development</option>
                                            <option>Mobile Development</option>
                                            <option>Data Science</option>
                                            <option>AI/ML</option>
                                            <option>Cloud Computing</option>
                                            <option>DevOps</option>
                                            <option>Cybersecurity</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Level *</label>
                                        <select name="level" className="form-select" value={courseData.level} onChange={handleChange}>
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                            <option>All Levels</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Duration *</label>
                                        <input
                                            type="text"
                                            name="duration"
                                            className="form-control"
                                            value={courseData.duration}
                                            onChange={handleChange}
                                            placeholder="e.g., 8 weeks, 40 hours"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Language</label>
                                        <select name="language" className="form-select" value={courseData.language} onChange={handleChange}>
                                            <option>English</option>
                                            <option>Spanish</option>
                                            <option>French</option>
                                            <option>German</option>
                                            <option>Chinese</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Course Thumbnail URL</label>
                                    <input
                                        type="url"
                                        name="thumbnail"
                                        className="form-control"
                                        value={courseData.thumbnail}
                                        onChange={handleChange}
                                        placeholder="https://example.com/thumbnail.jpg"
                                    />
                                    {courseData.thumbnail && (
                                        <div className="mt-2">
                                            <img src={courseData.thumbnail} alt="Preview" style={{ maxHeight: '100px' }} />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Tags</label>
                                    <div className="d-flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            placeholder="Add tags (e.g., JavaScript, React)"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <button type="button" className="btn btn-primary" onClick={addTag}>Add Tag</button>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {courseData.tags.map(tag => (
                                            <span key={tag} className="badge bg-primary p-2">
                                                {tag}
                                                <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '10px' }} onClick={() => removeTag(tag)}></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Course Content */}
                        {currentStep === 2 && (
                            <div className="fade-in">
                                <h3 className="mb-4">Course Content</h3>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Requirements/Prerequisites</label>
                                    {courseData.requirements.map((req, index) => (
                                        <div key={index} className="input-group mb-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={req}
                                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                                placeholder={`Requirement ${index + 1}`}
                                            />
                                            {index > 0 && (
                                                <button type="button" className="btn btn-danger" onClick={() => removeRequirement(index)}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addRequirement}>
                                        + Add Requirement
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Learning Outcomes</label>
                                    {courseData.learningOutcomes.map((outcome, index) => (
                                        <div key={index} className="input-group mb-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={outcome}
                                                onChange={(e) => handleOutcomeChange(index, e.target.value)}
                                                placeholder={`Outcome ${index + 1}`}
                                            />
                                            {index > 0 && (
                                                <button type="button" className="btn btn-danger" onClick={() => removeOutcome(index)}>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addOutcome}>
                                        + Add Outcome
                                    </button>
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        type="checkbox"
                                        name="certificateAvailable"
                                        className="form-check-input"
                                        checked={courseData.certificateAvailable}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label fw-bold">
                                        Offer Certificate upon completion
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Syllabus */}
                        {currentStep === 3 && (
                            <div className="fade-in">
                                <h3 className="mb-4">Course Syllabus</h3>
                                
                                {courseData.syllabus.map((week, weekIndex) => (
                                    <div key={weekIndex} className="card mb-4">
                                        <div className="card-header bg-light">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <strong>Week {week.week}</strong>
                                                {weekIndex > 0 && (
                                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeWeek(weekIndex)}>
                                                        Remove Week
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label>Week Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={week.title}
                                                    onChange={(e) => handleSyllabusChange(weekIndex, 'title', e.target.value)}
                                                    placeholder="e.g., Introduction to Web Development"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label>Duration</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={week.duration}
                                                    onChange={(e) => handleSyllabusChange(weekIndex, 'duration', e.target.value)}
                                                    placeholder="e.g., 2 hours"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label>Topics</label>
                                                {week.topics.map((topic, topicIndex) => (
                                                    <div key={topicIndex} className="input-group mb-2">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={topic}
                                                            onChange={(e) => handleTopicChange(weekIndex, topicIndex, e.target.value)}
                                                            placeholder={`Topic ${topicIndex + 1}`}
                                                        />
                                                        {topicIndex > 0 && (
                                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => {
                                                                const newSyllabus = [...courseData.syllabus];
                                                                newSyllabus[weekIndex].topics = newSyllabus[weekIndex].topics.filter((_, i) => i !== topicIndex);
                                                                setCourseData({ ...courseData, syllabus: newSyllabus });
                                                            }}>
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => addTopic(weekIndex)}>
                                                    + Add Topic
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <button type="button" className="btn btn-primary" onClick={addWeek}>
                                    + Add Week
                                </button>
                            </div>
                        )}

                        {/* Step 4: Pricing & Publish */}
                        {currentStep === 4 && (
                            <div className="fade-in">
                                <h3 className="mb-4">Pricing & Publication</h3>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Price ($) *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            className="form-control form-control-lg"
                                            value={courseData.price}
                                            onChange={handleChange}
                                            placeholder="49.99"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Original Price ($)</label>
                                        <input
                                            type="number"
                                            name="originalPrice"
                                            className="form-control form-control-lg"
                                            value={courseData.originalPrice}
                                            onChange={handleChange}
                                            placeholder="99.99"
                                        />
                                        {courseData.originalPrice > courseData.price && (
                                            <small className="text-success">Save {Math.round(((courseData.originalPrice - courseData.price) / courseData.originalPrice) * 100)}%</small>
                                        )}
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Your course will be published immediately after creation. You can edit it anytime.
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="d-flex justify-content-between mt-4">
                            {currentStep > 1 && (
                                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setCurrentStep(currentStep - 1)}>
                                    Previous
                                </button>
                            )}
                            {currentStep < 4 && (
                                <button type="button" className="btn btn-primary btn-lg ms-auto" onClick={() => setCurrentStep(currentStep + 1)}>
                                    Next
                                </button>
                            )}
                            {currentStep === 4 && (
                                <button type="submit" className="btn btn-success btn-lg ms-auto" disabled={loading}>
                                    {loading ? 'Creating...' : 'Publish Course'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddCourse;