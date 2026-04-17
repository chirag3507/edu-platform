import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Profile() {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        bio: '',
        phone: '',
        location: '',
        website: '',
        interests: [],
        socialLinks: {
            github: '',
            linkedin: '',
            twitter: ''
        }
    });
    
    const [stats, setStats] = useState({
        coursesCompleted: 0,
        totalCourses: 0,
        messagesSent: 0,
        certificates: 0
    });
    
    const [recentActivity, setRecentActivity] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        fetchUserData();
        fetchUserStats();
        fetchRecentActivity();
    }, [user]);

    const fetchUserData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users/profile/me');
            const userData = response.data;
            setProfileData({
                name: userData.name || '',
                email: userData.email || '',
                bio: userData.bio || '',
                phone: userData.phone || '',
                location: userData.location || '',
                website: userData.website || '',
                interests: userData.interests || [],
                socialLinks: userData.socialLinks || { github: '', linkedin: '', twitter: '' }
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${user.id}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${user.id}/activity`);
            setRecentActivity(response.data);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put('http://localhost:5000/api/users/profile', profileData);
            updateUser(response.data.user);
            setIsEditing(false);
            alert('Profile updated successfully!');
            fetchUserData(); // Refresh data
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInterestChange = (interest) => {
        const updatedInterests = profileData.interests.includes(interest)
            ? profileData.interests.filter(i => i !== interest)
            : [...profileData.interests, interest];
        setProfileData({ ...profileData, interests: updatedInterests });
    };

    const interestOptions = ['Web Development', 'Mobile Apps', 'Data Science', 'AI/ML', 'Cloud Computing', 'DevOps', 'UI/UX Design', 'Cybersecurity'];

    const getActivityIcon = (type) => {
        switch(type) {
            case 'enrollment': return '📚';
            case 'completion': return '🎓';
            case 'chat': return '💬';
            default: return '📌';
        }
    };

    if (loadingData) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            {/* Header */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div className="card-body text-white p-5">
                            <h1 className="display-5 fw-bold mb-3">My Profile</h1>
                            <p className="lead mb-0">Manage your personal information and track your progress</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Left Column - Profile Info */}
                <div className="col-lg-4 mb-4">
                    {/* Profile Card */}
                    <div className="card border-0 shadow-lg mb-4">
                        <div className="card-body text-center p-4">
                            <img 
                                src={user?.profilePicture || 'https://via.placeholder.com/150'} 
                                alt="Profile" 
                                className="rounded-circle border border-4 border-primary mb-3"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                            <h3 className="mb-1">{profileData.name}</h3>
                            <p className="text-muted mb-2">
                                <span className="badge bg-info me-2">{user?.role?.toUpperCase()}</span>
                                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                            <p className="text-muted small">
                                <i className="fas fa-envelope me-1"></i> {profileData.email}
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards - Real Data */}
                    <div className="row g-3 mb-4">
                        {user?.role === 'student' && (
                            <>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm text-center p-3">
                                        <div className="display-4 text-primary">📚</div>
                                        <h5 className="mb-0 mt-2">{stats.coursesCompleted}</h5>
                                        <small className="text-muted">Courses Completed</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm text-center p-3">
                                        <div className="display-4 text-success">🎓</div>
                                        <h5 className="mb-0 mt-2">{stats.totalCourses}</h5>
                                        <small className="text-muted">Enrolled Courses</small>
                                    </div>
                                </div>
                            </>
                        )}
                        {user?.role === 'faculty' && (
                            <>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm text-center p-3">
                                        <div className="display-4 text-primary">📚</div>
                                        <h5 className="mb-0 mt-2">{stats.totalCourses}</h5>
                                        <small className="text-muted">Courses Created</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm text-center p-3">
                                        <div className="display-4 text-success">👨‍🎓</div>
                                        <h5 className="mb-0 mt-2">{stats.totalStudents || 0}</h5>
                                        <small className="text-muted">Total Students</small>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="col-6">
                            <div className="card border-0 shadow-sm text-center p-3">
                                <div className="display-4 text-info">💬</div>
                                <h5 className="mb-0 mt-2">{stats.messagesSent}</h5>
                                <small className="text-muted">Messages Sent</small>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card border-0 shadow-sm text-center p-3">
                                <div className="display-4 text-warning">🏆</div>
                                <h5 className="mb-0 mt-2">{stats.certificates}</h5>
                                <small className="text-muted">Certificates</small>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info - Real Data */}
                    {(profileData.phone || profileData.location || profileData.website) && (
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-white border-0 pt-4">
                                <h5 className="mb-0">Contact Information</h5>
                            </div>
                            <div className="card-body">
                                {profileData.phone && (
                                    <div className="mb-3">
                                        <small className="text-muted d-block">Phone</small>
                                        <p className="mb-0">{profileData.phone}</p>
                                    </div>
                                )}
                                {profileData.location && (
                                    <div className="mb-3">
                                        <small className="text-muted d-block">Location</small>
                                        <p className="mb-0">{profileData.location}</p>
                                    </div>
                                )}
                                {profileData.website && (
                                    <div>
                                        <small className="text-muted d-block">Website</small>
                                        <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                                            {profileData.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="col-lg-8">
                    {!isEditing ? (
                        <>
                            {/* Bio Section - Real Data */}
                            {profileData.bio && (
                                <div className="card border-0 shadow-lg mb-4">
                                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-4">
                                        <h5 className="mb-0">About Me</h5>
                                        <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                                            <i className="fas fa-edit me-1"></i> Edit Profile
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <p className="lead">{profileData.bio}</p>
                                        
                                        {profileData.interests.length > 0 && (
                                            <>
                                                <h6 className="mt-3">Interests</h6>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {profileData.interests.map(interest => (
                                                        <span key={interest} className="badge bg-primary p-2">
                                                            {interest}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!profileData.bio && (
                                <div className="card border-0 shadow-lg mb-4">
                                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-4">
                                        <h5 className="mb-0">About Me</h5>
                                        <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                                            <i className="fas fa-edit me-1"></i> Add Bio
                                        </button>
                                    </div>
                                    <div className="card-body text-center text-muted">
                                        <p>No bio added yet. Click edit to add your bio.</p>
                                    </div>
                                </div>
                            )}

                            {/* Social Links - Real Data */}
                            {(profileData.socialLinks.github || profileData.socialLinks.linkedin || profileData.socialLinks.twitter) && (
                                <div className="card border-0 shadow-lg mb-4">
                                    <div className="card-header bg-white border-0 pt-4">
                                        <h5 className="mb-0">Social Profiles</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex gap-3">
                                            {profileData.socialLinks.github && (
                                                <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" 
                                                   className="btn btn-dark">
                                                    <i className="fab fa-github me-1"></i> GitHub
                                                </a>
                                            )}
                                            {profileData.socialLinks.linkedin && (
                                                <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                                                   className="btn btn-info text-white">
                                                    <i className="fab fa-linkedin me-1"></i> LinkedIn
                                                </a>
                                            )}
                                            {profileData.socialLinks.twitter && (
                                                <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                                                   className="btn btn-primary">
                                                    <i className="fab fa-twitter me-1"></i> Twitter
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity - Real Data */}
                            {recentActivity.length > 0 && (
                                <div className="card border-0 shadow-lg">
                                    <div className="card-header bg-white border-0 pt-4">
                                        <h5 className="mb-0">Recent Activity</h5>
                                    </div>
                                    <div className="card-body">
                                        {recentActivity.map((activity, index) => (
                                            <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                <div className="me-3 display-6">{getActivityIcon(activity.type)}</div>
                                                <div className="flex-grow-1">
                                                    <p className="mb-0 fw-bold">{activity.action}</p>
                                                    <small className="text-muted">
                                                        {new Date(activity.date).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Edit Form
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-white border-0 pt-4">
                                <h5 className="mb-0">Edit Profile</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleUpdate}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Bio</label>
                                        <textarea
                                            className="form-control"
                                            rows="4"
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Phone</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Website</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={profileData.website}
                                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Interests</label>
                                        <div className="d-flex flex-wrap gap-3">
                                            {interestOptions.map(interest => (
                                                <div key={interest} className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={interest}
                                                        checked={profileData.interests.includes(interest)}
                                                        onChange={() => handleInterestChange(interest)}
                                                    />
                                                    <label className="form-check-label" htmlFor={interest}>
                                                        {interest}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Social Links</label>
                                        <div className="mb-2">
                                            <i className="fab fa-github me-2"></i>
                                            <input
                                                type="url"
                                                className="form-control"
                                                placeholder="GitHub URL"
                                                value={profileData.socialLinks.github}
                                                onChange={(e) => setProfileData({
                                                    ...profileData, 
                                                    socialLinks: {...profileData.socialLinks, github: e.target.value}
                                                })}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <i className="fab fa-linkedin me-2"></i>
                                            <input
                                                type="url"
                                                className="form-control"
                                                placeholder="LinkedIn URL"
                                                value={profileData.socialLinks.linkedin}
                                                onChange={(e) => setProfileData({
                                                    ...profileData, 
                                                    socialLinks: {...profileData.socialLinks, linkedin: e.target.value}
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <i className="fab fa-twitter me-2"></i>
                                            <input
                                                type="url"
                                                className="form-control"
                                                placeholder="Twitter URL"
                                                value={profileData.socialLinks.twitter}
                                                onChange={(e) => setProfileData({
                                                    ...profileData, 
                                                    socialLinks: {...profileData.socialLinks, twitter: e.target.value}
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        </div>
    );
}

export default Profile;