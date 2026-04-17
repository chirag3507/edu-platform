import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
    const { user } = useAuth();
    const [myCourses, setMyCourses] = useState([]);
    const [myStudents, setMyStudents] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            console.log('Fetching data for user:', user); // Debug log
            
            if (user?.role === 'student') {
                // Fetch enrolled courses for student
                const coursesRes = await axios.get(`http://localhost:5000/api/users/student/${user.id}/courses`);
                setMyCourses(coursesRes.data);
                console.log('Enrolled courses:', coursesRes.data); // Debug log
                
                // Fetch available courses (published courses)
                const availableRes = await axios.get('http://localhost:5000/api/courses');
                setAvailableCourses(availableRes.data);
                console.log('Available courses:', availableRes.data); // Debug log
                
                // Fetch faculties for chat
                const facultiesRes = await axios.get('http://localhost:5000/api/users/faculties');
                setFaculties(facultiesRes.data);
            } 
            else if (user?.role === 'faculty') {
                // Fetch ALL courses created by faculty (using /all endpoint)
                const coursesRes = await axios.get('http://localhost:5000/api/courses/all');
                setMyCourses(coursesRes.data);
                console.log('My created courses:', coursesRes.data); // Debug log
                
                // Fetch students enrolled in faculty's courses
                const studentsRes = await axios.get(`http://localhost:5000/api/users/faculty/${user.id}/students`);
                setMyStudents(studentsRes.data);
                console.log('My students:', studentsRes.data); // Debug log
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await axios.post(`http://localhost:5000/api/courses/${courseId}/enroll`);
            alert('Successfully enrolled in course!');
            fetchDashboardData();
        } catch (error) {
            console.error('Enrollment error:', error);
            alert(error.response?.data?.message || 'Failed to enroll. Please try again.');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            setDeleteLoading(true);
            try {
                await axios.delete(`http://localhost:5000/api/courses/${courseId}`);
                alert('Course deleted successfully!');
                fetchDashboardData(); // Refresh the list
            } catch (error) {
                console.error('Error deleting course:', error);
                alert('Failed to delete course. Please try again.');
            } finally {
                setDeleteLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="card bg-primary text-white mb-4">
                        <div className="card-body">
                            <h2>Welcome, {user?.name}!</h2>
                            <p>Role: {user?.role?.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {user?.role === 'student' && (
                <>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-success text-white">
                                    <h4 className="mb-0">My Enrolled Courses ({myCourses.length})</h4>
                                </div>
                                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {myCourses.length === 0 ? (
                                        <p className="text-muted text-center py-4">You haven't enrolled in any courses yet. Browse courses below!</p>
                                    ) : (
                                        myCourses.map(course => (
                                            <div key={course._id} className="border-bottom mb-3 pb-3">
                                                <h5>{course.title}</h5>
                                                <p className="small text-muted">{course.description?.substring(0, 100)}...</p>
                                                <small className="text-muted">
                                                    <strong>Faculty:</strong> {course.facultyId?.name || course.facultyName}
                                                </small>
                                                <div className="mt-2">
                                                    <span className="badge bg-info">{course.category}</span>
                                                    <span className="badge bg-secondary ms-2">{course.level}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header bg-info text-white">
                                    <h4 className="mb-0">Available Courses ({availableCourses.length})</h4>
                                </div>
                                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {availableCourses.length === 0 ? (
                                        <p className="text-muted text-center py-4">No courses available at the moment.</p>
                                    ) : (
                                        availableCourses.map(course => {
                                            const isEnrolled = myCourses.some(c => c._id === course._id);
                                            return (
                                                <div key={course._id} className="border-bottom mb-3 pb-3">
                                                    <h5>{course.title}</h5>
                                                    <p className="small text-muted">{course.description?.substring(0, 100)}...</p>
                                                    <p><strong>Faculty:</strong> {course.facultyName}</p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="h5 text-primary">${course.price}</span>
                                                        {!isEnrolled ? (
                                                            <button 
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleEnroll(course._id)}
                                                            >
                                                                Enroll Now
                                                            </button>
                                                        ) : (
                                                            <span className="badge bg-success">Enrolled</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header bg-warning">
                                    <h4 className="mb-0">Chat with Faculties</h4>
                                </div>
                                <div className="card-body">
                                    {faculties.length === 0 ? (
                                        <p className="text-muted">No faculties available</p>
                                    ) : (
                                        faculties.map(faculty => (
                                            <Link 
                                                key={faculty._id} 
                                                to={`/chat/${faculty._id}`}
                                                className="list-group-item list-group-item-action mb-2"
                                            >
                                                <strong>{faculty.name}</strong>
                                                <small className="text-muted d-block">{faculty.email}</small>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {user?.role === 'faculty' && (
                <div className="row">
                    <div className="col-md-12">
                        <div className="card mb-4">
                            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">My Courses ({myCourses.length})</h4>
                                <Link to="/add-course" className="btn btn-light btn-sm">
                                    + Add New Course
                                </Link>
                            </div>
                            <div className="card-body">
                                {myCourses.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="fas fa-chalkboard fa-3x text-muted mb-3"></i>
                                        <h5>No courses created yet</h5>
                                        <p>Click the "Add New Course" button to create your first course!</p>
                                    </div>
                                ) : (
                                    <div className="row">
                                        {myCourses.map(course => (
                                            <div key={course._id} className="col-md-6 mb-4">
                                                <div className="card h-100">
                                                    <div className="card-body">
                                                        <h5>{course.title}</h5>
                                                        <p className="text-muted small">{course.description?.substring(0, 100)}...</p>
                                                        <div className="mb-2">
                                                            <span className="badge bg-primary">{course.category}</span>
                                                            <span className="badge bg-info ms-2">{course.level}</span>
                                                            <span className="badge bg-secondary ms-2">{course.duration}</span>
                                                        </div>
                                                        <p>
                                                            <strong>Students Enrolled:</strong> {course.students?.length || 0}<br />
                                                            <strong>Price:</strong> ${course.price}
                                                        </p>
                                                        <div className="d-flex gap-2">
                                                            <button 
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDeleteCourse(course._id)}
                                                                disabled={deleteLoading}
                                                            >
                                                                Delete Course
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header bg-info text-white">
                                <h4 className="mb-0">My Students ({myStudents.length})</h4>
                            </div>
                            <div className="card-body">
                                {myStudents.length === 0 ? (
                                    <p className="text-muted text-center py-4">No students enrolled in your courses yet.</p>
                                ) : (
                                    <div className="row">
                                        {myStudents.map(student => (
                                            <div key={student._id} className="col-md-4 mb-3">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <h6>{student.name}</h6>
                                                        <small className="text-muted d-block">{student.email}</small>
                                                        <Link to={`/chat/${student._id}`} className="btn btn-sm btn-primary mt-2">
                                                            Chat with Student
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {user?.role === 'admin' && (
                <div className="row">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header bg-danger text-white">
                                <h4 className="mb-0">Admin Overview</h4>
                            </div>
                            <div className="card-body">
                                <p>Welcome to Admin Panel. Use the Admin link in navigation to manage everything.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;