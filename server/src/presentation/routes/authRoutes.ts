import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { GoogleLoginUseCase } from '../../application/use-cases/GoogleLoginUseCase';
import { UpdateStatsUseCase } from '../../application/use-cases/UpdateStatsUseCase';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { GoogleTokenVerifier } from '../../infrastructure/services/GoogleTokenVerifier';
import { JwtService } from '../../infrastructure/services/JwtService';

const router = Router();

// Instantiate dependencies and wire them up (Dependency Injection)
const userRepository = new UserRepository();
const googleTokenVerifier = new GoogleTokenVerifier();
const jwtService = new JwtService();

const googleLoginUseCase = new GoogleLoginUseCase(
  userRepository,
  googleTokenVerifier,
  jwtService
);

const updateStatsUseCase = new UpdateStatsUseCase(userRepository);

const authController = new AuthController(googleLoginUseCase, updateStatsUseCase);

// Authentication Middleware to protect routes
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing bearer token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtService.verifyToken(token);
    (req as any).user = decoded; // Attach payload (userId, email, role) to the request
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid authentication token.' });
  }
};

// POST /api/auth/google-login
router.post('/google-login', (req, res) => authController.googleLogin(req, res));

// POST /api/auth/update-stats (Protected)
router.post('/update-stats', authMiddleware, (req, res) => authController.updateStats(req, res));

export { authMiddleware, jwtService };
export default router;
