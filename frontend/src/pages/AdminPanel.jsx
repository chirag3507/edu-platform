import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
    const [faculties, setFaculties] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const facultiesRes = await axios.get('http://localhost:5000/api/users/faculties');
        const studentsRes = await axios.get('http://localhost:5000/api/users/students');
        const coursesRes = await axios.get('http://localhost:5000/api/courses');
        
        setFaculties(facultiesRes.data);
        setStudents(studentsRes.data);
        setCourses(coursesRes.data);
    };

    return (
        <div className="container mt-4">
            <h2>Admin Panel</h2>
            
            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h4>Faculties ({faculties.length})</h4>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {faculties.map(faculty => (
                                    <div key={faculty._id} className="list-group-item">
                                        <strong>{faculty.name}</strong><br />
                                        <small>{faculty.email}</small>
                                        <button className="btn btn-sm btn-info float-end">Chat</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h4>Students ({students.length})</h4>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {students.map(student => (
                                    <div key={student._id} className="list-group-item">
                                        <strong>{student.name}</strong><br />
                                        <small>{student.email}</small>
                                        <button className="btn btn-sm btn-info float-end">Chat</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h4>All Courses ({courses.length})</h4>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {courses.map(course => (
                                    <div key={course._id} className="list-group-item">
                                        <strong>{course.title}</strong><br />
                                        <small>Faculty: {course.facultyName}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;