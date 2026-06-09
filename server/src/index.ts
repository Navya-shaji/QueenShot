import app from './app';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Database Connection with Graceful Fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queenshot';

console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`==========================================`);
    console.log(`  Database: Connected to MongoDB successfully!`);
    console.log(`==========================================`);
  })
  .catch((err) => {
    console.log(`==========================================`);
    console.log(`⚠️  DATABASE WARNING: Could not connect to MongoDB.`);
    console.log(`   Error: ${err.message}`);
    console.log(`   Please ensure MongoDB is running locally on port 27017,`);
    console.log(`   or configure a valid MONGO_URI in your server/.env file.`);
    console.log(`==========================================`);
  });

// Start Express server directly
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`  QueenShot Auth Server is running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==========================================`);
});
