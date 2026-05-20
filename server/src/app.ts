import express from 'express';
import cors from 'cors';
import authRoutes from './presentation/routes/authRoutes';

const app = express();

// Configure CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);

// Basic HTTP health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Carrom backend is healthy and running.',
  });
});

export default app;
