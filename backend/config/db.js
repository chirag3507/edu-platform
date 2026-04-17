const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduplatform';
        console.log('Attempting to connect to MongoDB at:', mongoURI);
        
        await mongoose.connect(mongoURI);
        
        console.log('✅ MongoDB Connected Successfully');
        console.log('Database:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('Please make sure MongoDB is installed and running');
        console.error('On Windows: Run "mongod" in Command Prompt as Administrator');
        console.error('On Mac/Linux: Run "sudo systemctl start mongod" or "mongod"');
        process.exit(1);
    }
};

module.exports = connectDB;