import express, { Request, Response } from 'express';
import { MongooseUserRepository } from '../../adapters/repositories/MongooseUserRepository';
import { GetUserProfile } from '../../use_cases/GetUserProfile';
import { UpdateUserProfile } from '../../use_cases/UpdateUserProfile';
import { UserController } from '../../adapters/controllers/UserController';
import { authMiddleware } from '../../presentation/routes/authRoutes';

const router = express.Router();

// 1. Instantiate the database adapter (implements UserRepository interface)
const userRepository = new MongooseUserRepository();

// 2. Instantiate high-level Use Cases, injecting the repository
const getUserProfile = new GetUserProfile(userRepository);
const updateUserProfile = new UpdateUserProfile(userRepository);

// 3. Instantiate the HTTP adapter Controller, injecting the Use Cases
const userController = new UserController(getUserProfile, updateUserProfile);

// --- EXPRESS ENDPOINTS (JWT protected) ---
// GET /api/users/profile  — reads userId from JWT payload (req.user.userId)
router.get('/profile', authMiddleware, (req: Request, res: Response) => userController.getProfile(req, res));

// PUT /api/users/profile  — reads userId from JWT payload (req.user.userId)
router.put('/profile', authMiddleware, (req: Request, res: Response) => userController.updateProfile(req, res));

export { router, userRepository };
