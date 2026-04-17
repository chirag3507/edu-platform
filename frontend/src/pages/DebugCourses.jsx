import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DebugCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllCourses();
    }, []);

    const fetchAllCourses = async () => {
        try {
            // Try to get all courses without filtering
            const response = await axios.get('http://localhost:5000/api/courses/all', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setCourses(response.data);
            console.log('All courses:', response.data);
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (error) return <div className="alert alert-danger mt-5">{error}</div>;

    return (
        <div className="container mt-5">
            <h2>Debug: All Courses in Database</h2>
            <p>Total Courses: {courses.length}</p>
            <div className="row">
                {courses.map(course => (
                    <div key={course._id} className="col-md-4 mb-3">
                        <div className="card">
                            <div className="card-body">
                                <h5>{course.title}</h5>
                                <p><strong>Status:</strong> {course.status}</p>
                                <p><strong>Faculty:</strong> {course.facultyName}</p>
                                <p><strong>Created:</strong> {new Date(course.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DebugCourses;