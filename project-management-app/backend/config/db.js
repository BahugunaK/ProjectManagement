const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/pm_app';
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
