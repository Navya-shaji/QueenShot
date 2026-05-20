const express = require('express');
const router = express.Router();

// --- DEPENDENCY WIRING FACTORY (Dependency Inversion in practice) ---
const MongooseUserRepository = require('../../adapters/repositories/MongooseUserRepository');
const GetUserProfile = require('../../use_cases/GetUserProfile');
const UpdateUserProfile = require('../../use_cases/UpdateUserProfile');
const UserController = require('../../adapters/controllers/UserController');

// 1. Instantiate the database adapter (implements UserRepository interface)
const userRepository = new MongooseUserRepository();

// 2. Instantiate high-level Use Cases, injecting the repository
const getUserProfile = new GetUserProfile(userRepository);
const updateUserProfile = new UpdateUserProfile(userRepository);

// 3. Instantiate the HTTP adapter Controller, injecting the Use Cases
const userController = new UserController(getUserProfile, updateUserProfile);

// --- EXPRESS ENDPOINTS ---
router.get('/profile', (req, res) => userController.getProfile(req, res));
router.put('/profile', (req, res) => userController.updateProfile(req, res));

module.exports = {
  router,
  userRepository // Exported so that the Socket.io multiplayer socket file can reuse the same DB instance for ELO statistics updates!
};
