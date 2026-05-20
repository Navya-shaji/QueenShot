import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import setupSocketHandlers from './socket';
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

const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific origins for security
    methods: ['GET', 'POST'],
  },
});

// Load real-time socket events handler
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`  Carrom Game Server is running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==========================================`);
});
