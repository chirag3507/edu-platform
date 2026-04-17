const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, 'secretkey');
        const user = await User.findById(decoded.userId);
        
        if (!user) throw new Error();
        
        req.user = { userId: user._id, role: user.role, name: user.name };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};