import React from 'react';

function About() {
    return (
        <div className="container my-5">
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <h1 className="text-center mb-4">About Us</h1>
                    <div className="card">
                        <div className="card-body">
                            <h4>Our Mission</h4>
                            <p>To provide quality education accessible to everyone, everywhere. We believe in empowering students through technology and expert guidance.</p>
                            
                            <h4 className="mt-4">What We Offer</h4>
                            <ul>
                                <li>Expert faculty from top institutions</li>
                                <li>Interactive learning experience</li>
                                <li>Real-time doubt solving through chat</li>
                                <li>Comprehensive course materials</li>
                                <li>Industry-recognized certifications</li>
                            </ul>
                            
                            <h4 className="mt-4">Our Team</h4>
                            <p>We have a dedicated team of educators and technologists working together to create the best learning experience for you.</p>
                            
                            <h4 className="mt-4">Contact Us</h4>
                            <p>Email: info@eduplatform.com<br />
                            Phone: +1 234 567 8900<br />
                            Address: 123 Education Street, Learning City</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;