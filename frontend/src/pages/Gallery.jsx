import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Gallery() {
    const [images, setImages] = useState([]);
    const [filteredImages, setFilteredImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [newImage, setNewImage] = useState({ 
        title: '', 
        imageUrl: '', 
        description: '',
        category: 'general',
        tags: []
    });
    const [currentTag, setCurrentTag] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid, masonry, list
    const [sortBy, setSortBy] = useState('newest');
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const categories = [
        { id: 'all', name: 'All Photos', icon: 'fa-images', color: 'primary' },
        { id: 'academic', name: 'Academic', icon: 'fa-graduation-cap', color: 'info' },
        { id: 'events', name: 'Events', icon: 'fa-calendar-alt', color: 'success' },
        { id: 'campus', name: 'Campus', icon: 'fa-building', color: 'warning' },
        { id: 'students', name: 'Students', icon: 'fa-users', color: 'danger' },
        { id: 'faculty', name: 'Faculty', icon: 'fa-chalkboard-user', color: 'secondary' },
        { id: 'achievements', name: 'Achievements', icon: 'fa-trophy', color: 'success' },
        { id: 'general', name: 'General', icon: 'fa-camera', color: 'primary' }
    ];

    useEffect(() => {
        fetchImages();
    }, []);

    useEffect(() => {
        filterAndSortImages();
    }, [images, selectedCategory, searchTerm, sortBy]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/gallery');
            setImages(response.data);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortImages = () => {
        let filtered = [...images];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(img => img.category === selectedCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(img =>
                img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (img.description && img.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (img.tags && img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }

        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'popular':
                filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                break;
        }

        setFilteredImages(filtered);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewImage({ ...newImage, imageUrl: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleAddImage = async (e) => {
        e.preventDefault();
        if (!newImage.title || !newImage.imageUrl) {
            alert('Please fill in all required fields');
            return;
        }

        setUploading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/gallery', newImage);
            setImages([response.data, ...images]);
            resetForm();
            setShowAddModal(false);
            showNotification('Image added successfully!', 'success');
        } catch (error) {
            console.error('Error adding image:', error);
            showNotification('Failed to add image. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleEditImage = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const response = await axios.put(`http://localhost:5000/api/gallery/${editingImage._id}`, editingImage);
            setImages(images.map(img => img._id === editingImage._id ? response.data : img));
            setShowEditModal(false);
            setEditingImage(null);
            showNotification('Image updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating image:', error);
            showNotification('Failed to update image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;
        
        setDeleting(true);
        try {
            await axios.delete(`http://localhost:5000/api/gallery/${imageId}`);
            setImages(images.filter(img => img._id !== imageId));
            if (selectedImage?._id === imageId) {
                closeLightbox();
            }
            showNotification('Image deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting image:', error);
            showNotification('Failed to delete image', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleLikeImage = async (imageId) => {
        if (!user) {
            showNotification('Please login to like images', 'warning');
            return;
        }
        try {
            const response = await axios.post(`http://localhost:5000/api/gallery/${imageId}/like`);
            setImages(images.map(img => 
                img._id === imageId ? { ...img, likes: response.data.likes, likedBy: response.data.likedBy } : img
            ));
        } catch (error) {
            console.error('Error liking image:', error);
        }
    };

    const addTag = () => {
        if (currentTag && !newImage.tags.includes(currentTag)) {
            setNewImage({
                ...newImage,
                tags: [...newImage.tags, currentTag]
            });
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setNewImage({
            ...newImage,
            tags: newImage.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const resetForm = () => {
        setNewImage({ 
            title: '', 
            imageUrl: '', 
            description: '',
            category: 'general',
            tags: []
        });
        setCurrentTag('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openLightbox = (image) => {
        setSelectedImage(image);
        setShowLightbox(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        setSelectedImage(null);
        document.body.style.overflow = 'auto';
    };

    const navigateLightbox = (direction) => {
        const currentIndex = filteredImages.findIndex(img => img._id === selectedImage._id);
        let newIndex;
        if (direction === 'next') {
            newIndex = currentIndex + 1 >= filteredImages.length ? 0 : currentIndex + 1;
        } else {
            newIndex = currentIndex - 1 < 0 ? filteredImages.length - 1 : currentIndex - 1;
        }
        setSelectedImage(filteredImages[newIndex]);
    };

    const showNotification = (message, type) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    const getCategoryColor = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.color : 'primary';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading beautiful memories...</p>
            </div>
        );
    }

    return (
        <div className="gallery-container">
            {/* Hero Section */}
            <div className="gallery-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Photo Gallery</h1>
                    <p className="hero-subtitle">Capturing moments, creating memories</p>
                    <div className="hero-stats">
                        <div className="stat">
                            <i className="fas fa-images"></i>
                            <span>{images.length} Photos</span>
                        </div>
                        <div className="stat">
                            <i className="fas fa-heart"></i>
                            <span>{images.reduce((sum, img) => sum + (img.likes || 0), 0)} Likes</span>
                        </div>
                        <div className="stat">
                            <i className="fas fa-users"></i>
                            <span>{images.filter(img => img.uploadedBy).length} Contributors</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="gallery-controls">
                <div className="controls-left">
                    <div className="view-toggle">
                        <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                            <i className="fas fa-th"></i>
                        </button>
                        <button className={`view-btn ${viewMode === 'masonry' ? 'active' : ''}`} onClick={() => setViewMode('masonry')}>
                            <i className="fas fa-bars"></i>
                        </button>
                    </div>
                    <div className="sort-select">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Popular</option>
                            <option value="title">By Title</option>
                        </select>
                    </div>
                </div>

                <div className="controls-right">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search photos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    {(user?.role === 'faculty' || user?.role === 'admin') && (
                        <button className="add-photo-btn" onClick={() => setShowAddModal(true)}>
                            <i className="fas fa-plus"></i>
                            <span>Add Photo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Categories */}
            <div className="categories-wrapper">
                <div className="categories-scroll">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <i className={`fas ${category.icon}`}></i>
                            <span>{category.name}</span>
                            {category.id !== 'all' && (
                                <span className="category-count">
                                    {images.filter(img => img.category === category.id).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Grid */}
            {filteredImages.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-camera-retro"></i>
                    <h3>No photos found</h3>
                    <p>Try different filters or add some photos to the gallery</p>
                    {(user?.role === 'faculty' || user?.role === 'admin') && (
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            Upload First Photo
                        </button>
                    )}
                </div>
            ) : (
                <div className={`image-grid ${viewMode}`}>
                    {filteredImages.map((image, index) => (
                        <div key={image._id} className="image-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="image-wrapper">
                                <img 
                                    src={image.imageUrl} 
                                    alt={image.title}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                    }}
                                    onClick={() => openLightbox(image)}
                                />
                                <div className="image-overlay">
                                    <button className="overlay-btn" onClick={() => openLightbox(image)}>
                                        <i className="fas fa-search-plus"></i>
                                    </button>
                                    {(user?.role === 'faculty' || user?.role === 'admin') && (
                                        <>
                                            <button className="overlay-btn edit" onClick={() => {
                                                setEditingImage(image);
                                                setShowEditModal(true);
                                            }}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="overlay-btn delete" onClick={() => handleDeleteImage(image._id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="image-badge">
                                    <span className={`badge ${getCategoryColor(image.category)}`}>
                                        <i className={`fas ${categories.find(c => c.id === image.category)?.icon}`}></i>
                                        {image.category}
                                    </span>
                                </div>
                            </div>
                            <div className="image-info">
                                <h4>{image.title}</h4>
                                <p>{image.description?.substring(0, 80)}...</p>
                                <div className="image-meta">
                                    <div className="meta-item">
                                        <i className="fas fa-heart" style={{ color: image.likedBy?.includes(user?.id) ? '#e74c3c' : '#999' }}></i>
                                        <span>{image.likes || 0}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-calendar"></i>
                                        <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <button className="like-btn" onClick={() => handleLikeImage(image._id)}>
                                        <i className={`fas fa-heart ${image.likedBy?.includes(user?.id) ? 'liked' : ''}`}></i>
                                    </button>
                                </div>
                                {image.tags && image.tags.length > 0 && (
                                    <div className="image-tags">
                                        {image.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="tag">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Photo Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content add-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-cloud-upload-alt"></i> Upload New Photo</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddImage}>
                                <div className="form-group">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        placeholder="Give your photo a title"
                                        value={newImage.title}
                                        onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Upload Image *</label>
                                    <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                                        {newImage.imageUrl ? (
                                            <div className="upload-preview">
                                                <img src={newImage.imageUrl} alt="Preview" />
                                                <button type="button" className="change-image" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewImage({...newImage, imageUrl: ''});
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}>
                                                    <i className="fas fa-sync-alt"></i> Change
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <i className="fas fa-cloud-upload-alt fa-3x"></i>
                                                <p>Click or drag image here</p>
                                                <small>PNG, JPG, GIF up to 5MB</small>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <div className="category-selector">
                                        {categories.filter(c => c.id !== 'all').map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                className={`category-option ${newImage.category === cat.id ? 'active' : ''}`}
                                                onClick={() => setNewImage({...newImage, category: cat.id})}
                                            >
                                                <i className={`fas ${cat.icon}`}></i>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Write a description..."
                                        value={newImage.description}
                                        onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Tags</label>
                                    <div className="tag-input">
                                        <input
                                            type="text"
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            placeholder="Add tags (press Enter)"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        />
                                        <button type="button" onClick={addTag}>Add</button>
                                    </div>
                                    <div className="tags-list">
                                        {newImage.tags.map(tag => (
                                            <span key={tag} className="tag">
                                                #{tag}
                                                <i className="fas fa-times" onClick={() => removeTag(tag)}></i>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="submit" className="btn-primary" disabled={uploading}>
                                        {uploading ? 'Uploading...' : 'Upload Photo'}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingImage && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><i className="fas fa-edit"></i> Edit Photo</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleEditImage}>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={editingImage.title}
                                        onChange={(e) => setEditingImage({...editingImage, title: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        rows="3"
                                        value={editingImage.description || ''}
                                        onChange={(e) => setEditingImage({...editingImage, description: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select 
                                        value={editingImage.category}
                                        onChange={(e) => setEditingImage({...editingImage, category: e.target.value})}
                                    >
                                        {categories.filter(c => c.id !== 'all').map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn-primary" disabled={uploading}>
                                        {uploading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {showLightbox && selectedImage && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>×</button>
                        <button className="lightbox-nav prev" onClick={() => navigateLightbox('prev')}>‹</button>
                        <button className="lightbox-nav next" onClick={() => navigateLightbox('next')}>›</button>
                        
                        <div className="lightbox-content">
                            <img src={selectedImage.imageUrl} alt={selectedImage.title} />
                            <div className="lightbox-info">
                                <div className="lightbox-header">
                                    <h2>{selectedImage.title}</h2>
                                    <button className="lightbox-like" onClick={() => handleLikeImage(selectedImage._id)}>
                                        <i className={`fas fa-heart ${selectedImage.likedBy?.includes(user?.id) ? 'liked' : ''}`}></i>
                                        <span>{selectedImage.likes || 0}</span>
                                    </button>
                                </div>
                                <p>{selectedImage.description}</p>
                                <div className="lightbox-meta">
                                    <span><i className="fas fa-calendar"></i> {new Date(selectedImage.createdAt).toLocaleDateString()}</span>
                                    <span><i className="fas fa-user"></i> {selectedImage.uploadedByName || 'Anonymous'}</span>
                                    <span><i className="fas fa-tag"></i> {selectedImage.category}</span>
                                </div>
                                {selectedImage.tags && selectedImage.tags.length > 0 && (
                                    <div className="lightbox-tags">
                                        {selectedImage.tags.map(tag => (
                                            <span key={tag} className="tag">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Styles */}
            <style jsx="true">{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .gallery-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }

                /* Hero Section */
                .gallery-hero {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 60px 20px;
                    text-align: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .gallery-hero::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: rotate 20s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: bold;
                    margin-bottom: 15px;
                    animation: fadeInUp 0.8s ease;
                }

                .hero-subtitle {
                    font-size: 1.2rem;
                    opacity: 0.95;
                    margin-bottom: 30px;
                    animation: fadeInUp 0.8s ease 0.1s both;
                }

                .hero-stats {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    animation: fadeInUp 0.8s ease 0.2s both;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                }

                .stat i {
                    font-size: 1.5rem;
                }

                /* Controls Bar */
                .gallery-controls {
                    max-width: 1400px;
                    margin: -30px auto 30px;
                    padding: 20px 30px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                    position: relative;
                    z-index: 10;
                }

                .controls-left, .controls-right {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .view-toggle {
                    display: flex;
                    gap: 5px;
                    background: #f0f0f0;
                    padding: 5px;
                    border-radius: 10px;
                }

                .view-btn {
                    padding: 8px 15px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.3s;
                }

                .view-btn.active {
                    background: #667eea;
                    color: white;
                }

                .sort-select select {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                }

                .search-box {
                    position: relative;
                }

                .search-box i {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                }

                .search-box input {
                    padding: 10px 35px 10px 40px;
                    border: 1px solid #ddd;
                    border-radius: 25px;
                    width: 250px;
                    transition: all 0.3s;
                }

                .search-box input:focus {
                    outline: none;
                    border-color: #667eea;
                    width: 300px;
                }

                .clear-search {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #999;
                }

                .add-photo-btn {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }

                .add-photo-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102,126,234,0.4);
                }

                /* Categories */
                .categories-wrapper {
                    max-width: 1400px;
                    margin: 0 auto 30px;
                    padding: 0 20px;
                }

                .categories-scroll {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    padding: 10px 0;
                    scrollbar-width: thin;
                }

                .category-btn {
                    padding: 10px 20px;
                    border: none;
                    background: white;
                    border-radius: 25px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                    white-space: nowrap;
                }

                .category-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }

                .category-btn.active {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .category-count {
                    background: rgba(0,0,0,0.1);
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                /* Image Grid */
                .image-grid {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 20px 40px;
                    display: grid;
                    gap: 25px;
                }

                .image-grid.grid {
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                }

                .image-grid.masonry {
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                }

                .image-card {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s;
                    animation: fadeInUp 0.5s ease both;
                }

                .image-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }

                .image-wrapper {
                    position: relative;
                    overflow: hidden;
                    aspect-ratio: 4/3;
                }

                .image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s;
                }

                .image-card:hover .image-wrapper img {
                    transform: scale(1.1);
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .image-card:hover .image-overlay {
                    opacity: 1;
                }

                .overlay-btn {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: white;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .overlay-btn:hover {
                    transform: scale(1.1);
                }

                .overlay-btn.edit:hover {
                    background: #3498db;
                    color: white;
                }

                .overlay-btn.delete:hover {
                    background: #e74c3c;
                    color: white;
                }

                .image-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                }

                .badge {
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .badge.primary { background: #667eea; }
                .badge.info { background: #3498db; }
                .badge.success { background: #27ae60; }
                .badge.warning { background: #f39c12; }
                .badge.danger { background: #e74c3c; }
                .badge.secondary { background: #95a5a6; }

                .image-info {
                    padding: 20px;
                }

                .image-info h4 {
                    margin-bottom: 10px;
                    font-size: 1.1rem;
                }

                .image-info p {
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    margin-bottom: 12px;
                }

                .image-meta {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 10px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.8rem;
                    color: #999;
                }

                .like-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .like-btn .liked {
                    color: #e74c3c;
                }

                .image-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .tag {
                    font-size: 0.75rem;
                    color: #667eea;
                    background: #f0f0f0;
                    padding: 3px 8px;
                    border-radius: 12px;
                    cursor: pointer;
                }

                /* Modals */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.3s;
                }

                .modal-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s;
                }

                .modal-header {
                    padding: 20px 25px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                }

                .modal-body {
                    padding: 25px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }

                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                }

                .upload-area {
                    border: 2px dashed #ddd;
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .upload-area:hover {
                    border-color: #667eea;
                    background: #f8f9ff;
                }

                .upload-preview {
                    position: relative;
                }

                .upload-preview img {
                    max-width: 100%;
                    max-height: 200px;
                    border-radius: 8px;
                }

                .change-image {
                    margin-top: 10px;
                    padding: 5px 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .category-selector {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .category-option {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .category-option.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .tag-input {
                    display: flex;
                    gap: 10px;
                }

                .tag-input button {
                    padding: 0 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 10px;
                }

                .tags-list .tag {
                    background: #e0e7ff;
                    padding: 5px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tags-list .tag i {
                    cursor: pointer;
                }

                .modal-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                    margin-top: 25px;
                }

                .btn-primary {
                    padding: 12px 25px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .btn-secondary {
                    padding: 12px 25px;
                    background: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                /* Lightbox */
                .lightbox-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.95);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .lightbox-container {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    background: #1a1a1a;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .lightbox-close {
                    position: absolute;
                    top: 15px;
                    right: 25px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 3rem;
                    cursor: pointer;
                    z-index: 10;
                }

                .lightbox-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0,0,0,0.5);
                    color: white;
                    border: none;
                    font-size: 3rem;
                    padding: 20px 15px;
                    cursor: pointer;
                    z-index: 10;
                }

                .lightbox-nav.prev { left: 0; }
                .lightbox-nav.next { right: 0; }

                .lightbox-content img {
                    max-width: 100%;
                    max-height: 70vh;
                    object-fit: contain;
                }

                .lightbox-info {
                    padding: 20px;
                    background: white;
                }

                .lightbox-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .lightbox-like {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .lightbox-like .liked {
                    color: #e74c3c;
                }

                .lightbox-meta {
                    display: flex;
                    gap: 20px;
                    margin: 15px 0;
                    color: #666;
                }

                .lightbox-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                }

                .empty-state i {
                    font-size: 4rem;
                    color: #ccc;
                    margin-bottom: 20px;
                }

                /* Notifications */
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 4000;
                    animation: slideInRight 0.3s;
                }

                .notification-content {
                    padding: 15px 25px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .notification-success {
                    border-left: 4px solid #27ae60;
                }

                .notification-error {
                    border-left: 4px solid #e74c3c;
                }

                /* Loading */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                }

                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                /* Animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .hero-title { font-size: 2rem; }
                    .hero-stats { flex-direction: column; gap: 15px; }
                    .gallery-controls { flex-direction: column; }
                    .controls-left, .controls-right { width: 100%; justify-content: center; }
                    .search-box input { width: 100%; }
                    .search-box input:focus { width: 100%; }
                    .image-grid { gap: 15px; }
                    .image-grid.grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

export default Gallery;