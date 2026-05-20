import mongoose from 'mongoose';

/**
 * Connects to MongoDB using configured environmental string
 * Features a graceful fallback warning to ensure developers can run the server
 * even without an active local MongoDB instance configured!
 */
const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/queenshot';
  
  try {
    // Connect to mongoose
    await mongoose.connect(uri);
    console.log('💚 MongoDB connection established successfully.');
    return true;
  } catch (error: any) {
    console.log('\n⚠️  ==========================================================');
    console.log('⚠️   MONGODB CONNECTION WARNING!');
    console.log('⚠️   ----------------------------------------------------------');
    console.log(`⚠️   Could not connect to MongoDB at: ${uri}`);
    console.log(`⚠️   Reason: ${error.message}`);
    console.log('⚠️   ----------------------------------------------------------');
    console.log('⚠️   The server will run in "Local Mock Mode" fallback.');
    console.log('⚠️   Profile changes will be saved in transient in-memory cache.');
    console.log('⚠️  ==========================================================\n');
    return false;
  }
};

export default connectDB;
