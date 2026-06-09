import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app';

dotenv.config();

import connectDB from './infrastructure/database/mongoose';
import { router as userRoutes } from './infrastructure/routes/userRoutes';
import setupSocketHandlers from './socket';

// Connect DB (using my refactored method or fallback to their log)
connectDB();

const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific origins for security
    methods: ['GET', 'POST'],
  }
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
