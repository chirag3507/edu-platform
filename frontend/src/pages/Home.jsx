import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <div className="bg-primary text-white text-center py-5">
                <div className="container">
                    <h1 className="display-4">Welcome to EduPlatform</h1>
                    <p className="lead">Learn from the best faculties, anytime anywhere</p>
                    <Link to="/courses" className="btn btn-light btn-lg">Explore Courses</Link>
                </div>
            </div>
            
            <div className="container my-5">
                <div className="row">
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <h3>📚</h3>
                                <h5 className="card-title">Quality Courses</h5>
                                <p className="card-text">Access high-quality courses taught by expert faculties</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <h3>💬</h3>
                                <h5 className="card-title">Direct Chat</h5>
                                <p className="card-text">Chat directly with faculties to clear your doubts</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body text-center">
                                <h3>🎓</h3>
                                <h5 className="card-title">Certification</h5>
                                <p className="card-text">Get certified after completing your courses</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;