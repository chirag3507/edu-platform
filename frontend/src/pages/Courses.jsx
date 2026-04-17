import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Courses() {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const { user } = useAuth();

    const categories = ['all', 'Web Development', 'Mobile Development', 'Data Science', 'AI/ML', 'Cloud Computing', 'DevOps', 'Cybersecurity'];
    const levels = ['all', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/courses');
            console.log('Fetched courses:', response.data);
            console.log('Total courses:', response.data.length);
            setCourses(response.data);
            setFilteredCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to load courses. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        filterAndSortCourses();
    }, [courses, selectedCategory, selectedLevel, searchTerm, sortBy]);

    const filterAndSortCourses = () => {
        let filtered = [...courses];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(course => course.category === selectedCategory);
        }

        // Filter by level
        if (selectedLevel !== 'all') {
            filtered = filtered.filter(course => course.level === selectedLevel);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }

        // Sort courses
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                filtered.sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0));
                break;
            default:
                break;
        }

        setFilteredCourses(filtered);
    };

    const handleEnroll = async (courseId) => {
        if (!user) {
            alert('Please login to enroll in courses');
            return;
        }
        
        setEnrolling(true);
        try {
            const response = await axios.post(`http://localhost:5000/api/courses/${courseId}/enroll`);
            alert('Successfully enrolled in the course!');
            console.log('Enrollment response:', response.data);
            fetchCourses(); // Refresh course list
            setShowModal(false); // Close modal after enrollment
        } catch (error) {
            console.error('Error enrolling:', error);
            const errorMessage = error.response?.data?.message || 'Failed to enroll. Please try again.';
            alert(errorMessage);
        } finally {
            setEnrolling(false);
        }
    };

    const isUserEnrolled = (course) => {
        if (!user || !course.students) return false;
        return course.students.includes(user.userId);
    };

    const isUserInstructor = (course) => {
        if (!user) return false;
        return course.facultyId === user.userId || course.facultyId._id === user.userId;
    };

    const handleUnenroll = async (courseId) => {
        if (window.confirm('Are you sure you want to unenroll from this course?')) {
            setEnrolling(true);
            try {
                await axios.post(`http://localhost:5000/api/courses/${courseId}/unenroll`);
                alert('Successfully unenrolled from the course!');
                fetchCourses(); // Refresh course list
                setShowModal(false); // Close modal after unenrollment
            } catch (error) {
                console.error('Error unenrolling:', error);
                const errorMessage = error.response?.data?.message || 'Failed to unenroll. Please try again.';
                alert(errorMessage);
            } finally {
                setEnrolling(false);
            }
        }
    };

    const handleRemoveStudent = async (courseId, studentId, studentName) => {
        if (window.confirm(`Are you sure you want to remove ${studentName} from this course?`)) {
            try {
                await axios.delete(`http://localhost:5000/api/courses/${courseId}/students/${studentId}`);
                alert(`${studentName} has been removed from the course!`);
                fetchCourses(); // Refresh course list
            } catch (error) {
                console.error('Error removing student:', error);
                const errorMessage = error.response?.data?.message || 'Failed to remove student. Please try again.';
                alert(errorMessage);
            }
        }
    };

    const handleViewDetails = (course) => {
        setSelectedCourse(course);
        setShowModal(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCourse(null);
        // Restore body scroll
        document.body.style.overflow = 'auto';
    };

    const getStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={i} className="fas fa-star text-warning"></i>);
        }
        if (hasHalfStar) {
            stars.push(<i key="half" className="fas fa-star-half-alt text-warning"></i>);
        }
        while (stars.length < 5) {
            stars.push(<i key={stars.length} className="far fa-star text-warning"></i>);
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light" style={{ minHeight: '100vh' }}>
            {/* Hero Section */}
            <div className="bg-primary text-white py-5 mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="container">
                    <h1 className="display-4 fw-bold mb-3">Explore Our Courses</h1>
                    <p className="lead mb-4">Discover top-rated courses from expert instructors and advance your career</p>
                    
                    {/* Search Bar */}
                    <div className="row justify-content-center">
                        <div className="col-md-8">
                            <div className="input-group input-group-lg">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="btn btn-light" type="button">
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="row">
                    {/* Sidebar Filters */}
                    <div className="col-lg-3 mb-4">
                        <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                            <div className="card-body">
                                <h5 className="mb-3">Filters</h5>
                                
                                <div className="mb-4">
                                    <label className="fw-bold mb-2">Category</label>
                                    {categories.map(category => (
                                        <div key={category} className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                name="category"
                                                id={`cat-${category}`}
                                                checked={selectedCategory === category}
                                                onChange={() => setSelectedCategory(category)}
                                            />
                                            <label className="form-check-label" htmlFor={`cat-${category}`}>
                                                {category === 'all' ? 'All Categories' : category}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <label className="fw-bold mb-2">Level</label>
                                    {levels.map(level => (
                                        <div key={level} className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                name="level"
                                                id={`level-${level}`}
                                                checked={selectedLevel === level}
                                                onChange={() => setSelectedLevel(level)}
                                            />
                                            <label className="form-check-label" htmlFor={`level-${level}`}>
                                                {level === 'all' ? 'All Levels' : level}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <label className="fw-bold mb-2">Sort By</label>
                                    <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                </div>

                                <button className="btn btn-outline-primary w-100" onClick={() => {
                                    setSelectedCategory('all');
                                    setSelectedLevel('all');
                                    setSearchTerm('');
                                    setSortBy('newest');
                                }}>
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="col-lg-9">
                        <div className="mb-4">
                            <h4>Found {filteredCourses.length} courses</h4>
                        </div>

                        <div className="row">
                            {filteredCourses.map(course => (
                                <div key={course._id} className="col-md-6 col-lg-6 mb-4">
                                    <div className="card h-100 border-0 shadow-sm course-card">
                                        <img 
                                            src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course+Thumbnail'} 
                                            className="card-img-top" 
                                            alt={course.title}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                        <div className="card-body">
                                            <div className="mb-2">
                                                <span className="badge bg-primary me-2">{course.category || 'General'}</span>
                                                <span className="badge bg-info">{course.level || 'All Levels'}</span>
                                            </div>
                                            <h5 className="card-title">{course.title}</h5>
                                            <p className="card-text text-muted small">
                                                {course.shortDescription || (course.description ? course.description.substring(0, 100) : 'No description available')}...
                                            </p>
                                            <div className="mb-2">
                                                {getStars(course.rating)}
                                                <span className="text-muted ms-2">({course.totalReviews || 0} reviews)</span>
                                            </div>
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                    <i className="fas fa-user-graduate me-1"></i> 
                                                    {course.students?.length || 0} students
                                                </small>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="fas fa-clock me-1"></i> {course.duration || 'Flexible'}
                                                </small>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    <span className="h5 text-primary fw-bold">${course.price || 0}</span>
                                                    {course.originalPrice > course.price && (
                                                        <span className="text-muted ms-2">
                                                            <del>${course.originalPrice}</del>
                                                        </span>
                                                    )}
                                                </div>
                                                {isUserEnrolled(course) ? (
                                                    <button 
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleViewDetails(course)}
                                                    >
                                                        <i className="fas fa-check me-1"></i>Enrolled
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleViewDetails(course)}
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredCourses.length === 0 && (
                            <div className="text-center py-5">
                                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                <h4>No courses found</h4>
                                <p className="text-muted">Try adjusting your filters or search term</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Modal - Simple and Reliable */}
            {showModal && selectedCourse && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h5 className="modal-title">{selectedCourse.title}</h5>
                            <button type="button" className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-7">
                                    <img 
                                        src={selectedCourse.thumbnail || 'https://via.placeholder.com/800x400'} 
                                        className="img-fluid rounded mb-3" 
                                        alt={selectedCourse.title}
                                        style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} 
                                    />
                                    
                                    <h4>About this course</h4>
                                    <p>{selectedCourse.description || 'No description available'}</p>
                                    
                                    {selectedCourse.learningOutcomes && selectedCourse.learningOutcomes.length > 0 && (
                                        <>
                                            <h4>What you'll learn</h4>
                                            <ul>
                                                {selectedCourse.learningOutcomes.map((outcome, idx) => (
                                                    <li key={idx}>
                                                        <i className="fas fa-check-circle text-success me-2"></i>
                                                        {outcome}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    
                                    {selectedCourse.syllabus && selectedCourse.syllabus.length > 0 && (
                                        <>
                                            <h4>Course Syllabus</h4>
                                            <div className="accordion" id="syllabusAccordion">
                                                {selectedCourse.syllabus.map((week, idx) => (
                                                    <div key={idx} className="accordion-item">
                                                        <h2 className="accordion-header">
                                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${idx}`}>
                                                                Week {week.week}: {week.title} ({week.duration})
                                                            </button>
                                                        </h2>
                                                        <div id={`collapse${idx}`} className="accordion-collapse collapse" data-bs-parent="#syllabusAccordion">
                                                            <div className="accordion-body">
                                                                <ul>
                                                                    {week.topics && week.topics.map((topic, topicIdx) => (
                                                                        <li key={topicIdx}>{topic}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="col-md-5">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <div className="text-center mb-3">
                                                <h2 className="text-primary">${selectedCourse.price || 0}</h2>
                                                {selectedCourse.originalPrice > selectedCourse.price && (
                                                    <small className="text-muted">Regular price: ${selectedCourse.originalPrice}</small>
                                                )}
                                            </div>
                                            
                                            {/* Enrollment Section */}
                                            {isUserEnrolled(selectedCourse) && !isUserInstructor(selectedCourse) ? (
                                                <>
                                                    <div className="alert alert-success w-100 mb-2" role="alert">
                                                        <i className="fas fa-check-circle me-2"></i>
                                                        <strong>You are enrolled</strong><br />
                                                        <small>You can access this course</small>
                                                    </div>
                                                    <button 
                                                        className="btn btn-danger w-100 mb-2 py-2"
                                                        onClick={() => handleUnenroll(selectedCourse._id)}
                                                        disabled={enrolling}
                                                    >
                                                        <i className="fas fa-times me-2"></i>
                                                        Unenroll from Course
                                                    </button>
                                                </>
                                            ) : !isUserInstructor(selectedCourse) ? (
                                                <button 
                                                    className="btn btn-success w-100 mb-2 py-2"
                                                    onClick={() => handleEnroll(selectedCourse._id)}
                                                    disabled={enrolling}
                                                    style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                                                >
                                                    {enrolling ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Enrolling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-shopping-cart me-2"></i>
                                                            Enroll Now
                                                        </>
                                                    )}
                                                </button>
                                            ) : null}
                                            
                                            <hr />
                                            
                                            <div className="mb-3">
                                                <small className="text-muted d-block">
                                                    <i className="fas fa-chalkboard-user me-2"></i>
                                                    <strong>Instructor:</strong> {selectedCourse.facultyName || 'Unknown'}
                                                </small>
                                                <small className="text-muted d-block mt-2">
                                                    <i className="fas fa-clock me-2"></i>
                                                    <strong>Duration:</strong> {selectedCourse.duration || 'Flexible'}
                                                </small>
                                                <small className="text-muted d-block mt-2">
                                                    <i className="fas fa-language me-2"></i>
                                                    <strong>Language:</strong> {selectedCourse.language || 'English'}
                                                </small>
                                                <small className="text-muted d-block mt-2">
                                                    <i className="fas fa-certificate me-2"></i>
                                                    <strong>Certificate:</strong> {selectedCourse.certificateAvailable ? 'Yes' : 'No'}
                                                </small>
                                                <small className="text-muted d-block mt-2">
                                                    <i className="fas fa-user-graduate me-2"></i>
                                                    <strong>Students Enrolled:</strong> {selectedCourse.students?.length || 0}
                                                </small>
                                            </div>
                                            
                                            {selectedCourse.requirements && selectedCourse.requirements.length > 0 && (
                                                <>
                                                    <hr />
                                                    <h6>Requirements</h6>
                                                    <ul className="small">
                                                        {selectedCourse.requirements.map((req, idx) => (
                                                            <li key={idx}>{req}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                            
                                            {/* Faculty: Manage Students Section */}
                                            {isUserInstructor(selectedCourse) && (
                                                <>
                                                    <hr />
                                                    <h6 className="mb-3">
                                                        <i className="fas fa-users me-2"></i>
                                                        Enrolled Students ({selectedCourse.students?.length || 0})
                                                    </h6>
                                                    {selectedCourse.students && selectedCourse.students.length > 0 ? (
                                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                            <div className="list-group list-group-sm">
                                                                {selectedCourse.students.map((student, idx) => (
                                                                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                                        <div>
                                                                            <small className="text-muted">{typeof student === 'object' ? student.name : `Student ${idx + 1}`}</small>
                                                                        </div>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => handleRemoveStudent(selectedCourse._id, student._id || student, typeof student === 'object' ? student.name : `Student ${idx + 1}`)}
                                                                        >
                                                                            <i className="fas fa-trash-alt"></i>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <small className="text-muted">No students enrolled yet</small>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1050;
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .modal-container {
                    background-color: white;
                    border-radius: 12px;
                    max-width: 1200px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
                    animation: slideDown 0.3s ease;
                }
                
                @keyframes slideDown {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .modal-header {
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-title {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: bold;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: white;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }
                
                .modal-close:hover {
                    opacity: 1;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .course-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    overflow: hidden;
                }
                
                .course-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
                }
                
                .course-card .card-img-top {
                    transition: transform 0.3s ease;
                }
                
                .course-card:hover .card-img-top {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}

export default Courses;