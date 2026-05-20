const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific origins for security
    methods: ['GET', 'POST'],
  }
});

// Basic HTTP health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Carrom backend is healthy and running.' });
});

// Load real-time socket events handler
const setupSocketHandlers = require('./socket');
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`  Carrom Game Server is running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==========================================`);
});
