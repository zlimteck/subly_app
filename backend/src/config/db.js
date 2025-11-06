import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/subly') {
    console.warn('⚠️  WARNING: No MongoDB URI configured or using placeholder.');
    console.warn('⚠️  The server will start but database operations will fail.');
    console.warn('⚠️  Please configure MONGODB_URI in your .env file.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    console.warn('⚠️  Server starting without database connection.');
  }
};

export default connectDB;