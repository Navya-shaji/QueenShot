import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './infrastructure/database/mongoose';
import { router as userRoutes } from './infrastructure/routes/userRoutes';
import setupSocketHandlers from './socket';

const app = express();
const server = http.createServer(app);

// Gracefully connect to MongoDB
connectDB();

// Configure CORS and parser middlewares
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/users', userRoutes);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific origins for security
    methods: ['GET', 'POST'],
  }
});

// Basic HTTP health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Carrom backend is healthy and running.' });
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
